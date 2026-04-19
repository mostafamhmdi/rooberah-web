"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Calendar, Tag, Plus, Trash2, Activity, BarChart2 } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from 'recharts';
import { TimeLog } from '@/types';
import AddDoings from '@/components/AddDoings';

// ==========================================
// 1. Helper Variables & Functions
// ==========================================

const colorMap: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#facc15',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
  rose: '#f43f5e',
  gray: '#6b7280',
};

const timeToDecimal = (timeStr: string | undefined): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours + (minutes / 60);
};

const getShamsiDate = (dateString: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date(dateString));
};

// تبدیل اعداد فارسی به انگلیسی برای محاسبات منطقی تاریخ
const persianToEnglishDigits = (str: string) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/[۰-۹]/g, w => persianDigits.indexOf(w).toString());
};

// دریافت سال و ماه شمسی از یک تاریخ میلادی
const getShamsiYearMonth = (dateString: string) => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric' });
  const parts = formatter.formatToParts(date);
  
  const yearStr = parts.find(p => p.type === 'year')?.value || '1400';
  const monthStr = parts.find(p => p.type === 'month')?.value || '1';
  
  return {
    year: parseInt(persianToEnglishDigits(yearStr), 10),
    month: parseInt(persianToEnglishDigits(monthStr), 10)
  };
};

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// ==========================================
// 2. Main Component
// ==========================================

export default function TimeLogsPage() {
  const API_BASE = 'http://127.0.0.1:8000/api';
  
  // --- Daily State ---
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dailyLogs, setDailyLogs] = useState<TimeLog[]>([]);
  
  // --- Monthly State ---
  const initialShamsi = getShamsiYearMonth(today);
  const [reportYear, setReportYear] = useState<number>(initialShamsi.year);
  const [reportMonth, setReportMonth] = useState<number>(initialShamsi.month);
  const [allLogs, setAllLogs] = useState<TimeLog[]>([]); // برای پردازش ماهانه
  
  // --- UI State ---
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. دریافت دیتای روزانه
      const dailyRes = await fetch(`${API_BASE}/time-logs/?date=${selectedDate}`);
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        const filteredDaily = data.filter((log: TimeLog) => log.date === selectedDate);
        setDailyLogs(filteredDaily);
      }

      // 2. دریافت کل دیتا برای داشبورد ماهانه (در صورت وجود API بهینه‌تر، می‌توان فقط دیتای ماه را گرفت)
      const allRes = await fetch(`${API_BASE}/time-logs/`);
      if (allRes.ok) {
        const data = await allRes.json();
        setAllLogs(data);
      }
    } catch (error) {
      console.error("خطا در دریافت اطلاعات:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این مورد اطمینان دارید؟')) return;
    try {
      const response = await fetch(`${API_BASE}/time-logs/${id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDailyLogs(dailyLogs.filter(log => log.id !== id));
        setAllLogs(allLogs.filter(log => log.id !== id));
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  // ------------------------------------------
  // Data Preparations
  // ------------------------------------------

  // دیتای نمودار دایره‌ای (روزانه)
  const dailyChartData = useMemo(() => {
    const grouped: Record<string, { name: string; value: number; color: string }> = {};
    dailyLogs.forEach(log => {
      const catName = log.category_details?.title || 'بدون دسته‌بندی';
      const catColor = log.category_details?.color ? colorMap[log.category_details.color] : colorMap['gray'];
      const duration = log.duration_minutes || 0;

      if (grouped[catName]) {
        grouped[catName].value += duration;
      } else {
        grouped[catName] = { name: catName, value: duration, color: catColor };
      }
    });
    return Object.values(grouped);
  }, [dailyLogs]);

  // دیتای نمودار میله‌ای (ماهانه)
  const monthlyChartData = useMemo(() => {
    const grouped: Record<string, { name: string; minutes: number; color: string }> = {};
    
    // فیلتر کردن لاگ‌ها بر اساس ماه و سال شمسی انتخاب شده
    allLogs.forEach(log => {
      const logShamsi = getShamsiYearMonth(log.date);
      if (logShamsi.year === reportYear && logShamsi.month === reportMonth) {
        const catName = log.category_details?.title || 'بدون دسته‌بندی';
        const catColor = log.category_details?.color ? colorMap[log.category_details.color] : colorMap['gray'];
        const duration = log.duration_minutes || 0;

        if (grouped[catName]) {
          grouped[catName].minutes += duration;
        } else {
          grouped[catName] = { name: catName, minutes: duration, color: catColor };
        }
      }
    });

    // تبدیل دقایق به ساعت برای نمایش در نمودار میله‌ای
    return Object.values(grouped).map(item => ({
      ...item,
      hours: Number((item.minutes / 60).toFixed(1))
    })).sort((a, b) => b.hours - a.hours); // مرتب سازی نزولی
  }, [allLogs, reportYear, reportMonth]);

  const totalMinutesToday = dailyLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalHoursToday = Math.floor(totalMinutesToday / 60);
  const remainingMinutesToday = totalMinutesToday % 60;

  const totalHoursMonthly = monthlyChartData.reduce((sum, item) => sum + item.hours, 0);

  // تولید لیست سال‌ها برای فیلتر (مثلا از ۲ سال پیش تا ۲ سال بعد)
  const yearsOptions = Array.from({length: 5}, (_, i) => initialShamsi.year - 2 + i);

  return (
    // حذف font-sans برای یکپارچگی با فونت اپلیکیشن
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ------------------------------------------------- */}
        {/* 1. Header & Date Filter (Daily) */}
        {/* ------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/" 
              className="p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">انجام دادنی‌ها</h1>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">مدیریت و پیگیری زمان‌های صرف شده</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200">
              <Calendar size={18} className="text-blue-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-gray-700 cursor-pointer"
              />
            </div>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">افزودن</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 2. Daily Dashboard Section */}
        {/* ------------------------------------------------- */}
        <div className="text-center text-gray-500 text-sm font-medium">
          {getShamsiDate(selectedDate)}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : dailyLogs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 flex flex-col items-center gap-3">
            <Clock size={48} className="text-gray-300" />
            <p>هیچ فعالیتی برای این روز ثبت نشده است.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 text-blue-600 font-bold hover:underline"
            >
              اولین فعالیت را ثبت کنید
            </button>
          </div>
        ) : (
          <>
            {/* نمودار تایم‌لاین 24 ساعته */}
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-8">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800">تایم‌لاین امروز</h2>
                </div>
              </div>

              <div className="relative pb-6" dir="ltr">
                <div className="h-12 bg-gray-100/80 rounded-xl w-full relative overflow-visible border border-gray-200 shadow-inner">
                  {dailyLogs.map((log) => {
                    const startDec = timeToDecimal(log.start_time);
                    const endDec = timeToDecimal(log.end_time);
                    const leftPercent = (startDec / 24) * 100;
                    let widthPercent = ((endDec - startDec) / 24) * 100;
                    if (widthPercent < 0) widthPercent = ((24 - startDec + endDec) / 24) * 100;

                    const categoryColor = log.category_details?.color ? colorMap[log.category_details.color] : colorMap['gray'];

                    return (
                      <div
                        key={log.id}
                        className="absolute top-0 bottom-0 border-r border-white/40 group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bottom-0.5"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: categoryColor,
                          borderRadius: widthPercent > 98 ? '0.75rem' : '0'
                        }}
                      >
                        <div 
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-3 rounded-xl min-w-[200px] z-20 pointer-events-none shadow-xl"
                          dir="rtl"
                        >
                          <p className="font-bold text-sm mb-2 text-center border-b border-gray-600 pb-2">
                            {log.title}
                          </p>
                          <div className="flex flex-col gap-1.5 text-xs text-gray-300">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> دسته:</span>
                              <span className="font-medium text-white">{log.category_details?.title || 'بدون دسته'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> زمان:</span>
                              <span dir="ltr" className="font-medium text-white text-[11px] bg-gray-700 px-1.5 py-0.5 rounded">
                                {log.start_time.substring(0, 5)} تا {log.end_time.substring(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-3 font-medium px-1">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>
            </div>

            {/* گرید دو ستونه: لیست فعالیت‌ها و نمودار دایره‌ای */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              <div className="lg:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white py-2 z-10">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-gray-700">لیست فعالیت‌ها</h2>
                </div>

                {dailyLogs.map((log) => {
                  const catColorHex = log.category_details?.color ? colorMap[log.category_details.color] : colorMap['gray'];

                  return (
                    <div key={log.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:border-gray-200 transition-all">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColorHex }}></div>
                          <h3 className="font-bold text-gray-800 text-base">{log.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span 
                            className="px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm border border-gray-100"
                            style={{ backgroundColor: `${catColorHex}20`, color: catColorHex }}
                          >
                            <Tag size={12} />
                            {log.category_details?.title || 'بدون دسته‌بندی'}
                          </span>
                          
                          <span className="text-gray-500 flex items-center gap-1 text-xs font-medium bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm" dir="ltr">
                            <Clock size={12} />
                            {log.start_time.substring(0, 5)} - {log.end_time.substring(0, 5)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-200">
                        <div className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-xl text-sm">
                          <span className="text-xs text-blue-400">مدت: </span>
                          <span dir="ltr">{log.duration_minutes} min</span>
                        </div>
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف فعالیت"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center h-fit sticky top-4">
                <h2 className="text-lg font-bold text-gray-700 w-full mb-4 text-right border-b border-gray-100 pb-2">پراکندگی زمان (امروز)</h2>
                
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dailyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dailyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <PieTooltip 
                        formatter={(value: number) => [`${value} دقیقه`, 'مدت زمان']}
                        contentStyle={{ borderRadius: '10px', textAlign: 'right', direction: 'rtl', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 w-full bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-bold border border-blue-100">
                  مجموع زمان ثبت شده امروز: 
                  <span className="mr-2 text-xl inline-block text-blue-600" dir="ltr">
                    {totalHoursToday > 0 ? `${totalHoursToday}h ` : ''}{remainingMinutesToday}m
                  </span>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ------------------------------------------------- */}
        {/* 3. Monthly Dashboard Section (New Feature) */}
        {/* ------------------------------------------------- */}
        <div className="mt-12 bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-xl">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">داشبورد مقایسه ماهانه</h2>
                <p className="text-sm text-gray-500 mt-1">بررسی میزان ساعت صرف شده در هر دسته‌بندی</p>
              </div>
            </div>

            {/* فیلترهای سال و ماه شمسی */}
            <div className="flex items-center gap-3">
              <select 
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none font-medium cursor-pointer"
              >
                {PERSIAN_MONTHS.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>

              <select 
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none font-medium cursor-pointer"
              >
                {yearsOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {monthlyChartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              دیتایی برای این ماه ثبت نشده است.
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* نمودار میله‌ای */}
              <div className="w-full lg:w-3/4 h-[350px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyChartData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'inherit' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      unit="h"
                    />
                    <BarTooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '12px', textAlign: 'right', direction: 'rtl', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value} ساعت`, 'مجموع زمان']}
                    />
                    <Bar 
                      dataKey="hours" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    >
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* خلاصه اطلاعات ماه */}
              <div className="w-full lg:w-1/4 flex flex-col gap-4">
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 text-center">
                  <h3 className="text-purple-800 font-bold mb-2">مجموع کارکرد ماه</h3>
                  <div className="text-3xl font-black text-purple-600" dir="ltr">
                    {totalHoursMonthly.toFixed(1)} <span className="text-lg font-bold text-purple-400">h</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-600 mb-3 border-b pb-2">بیشترین زمان صرف شده:</h4>
                  <ul className="space-y-3">
                    {monthlyChartData.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-gray-500 font-bold" dir="ltr">{item.hours} h</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------- */}
        {/* Modal */}
        {/* ------------------------------------------------- */}
        <AddDoings 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={fetchData} 
        />
        
      </div>
    </div>
  );
}
