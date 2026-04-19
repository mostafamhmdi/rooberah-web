"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { ArrowRight, BookOpen, Moon, Activity, Music, Calendar, Save, CheckCircle2, AlertCircle, BarChart3, Filter, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import FaalHafez from '@/components/FaalHafez';

// نگاشت مودها برای دسترسی راحت‌تر به ایموجی و متن
const moodMap: Record<string, { label: string, emoji: string }> = {
  excellent: { label: 'عالی', emoji: '🤩' },
  good: { label: 'خوب', emoji: '😀' },
  normal: { label: 'معمولی', emoji: '😐' },
  bad: { label: 'بد', emoji: '😞' },
  awful: { label: 'خیلی بد', emoji: '😭' },
};

const CustomMoodDot = (props: any) => {
  const { cx, cy, payload } = props;
  const emoji = moodMap[payload.mood]?.emoji || '😐';
  return (
    <text x={cx} y={cy} dy={-10} textAnchor="middle" fontSize={18}>
      {emoji}
    </text>
  );
};

// ابزار تبدیل تاریخ میلادی به شمسی با فرمت YYYY/MM/DD
const getShamsiDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'persian',
    numberingSystem: 'latn' // برای دریافت اعداد به صورت انگلیسی (جهت پردازش راحت‌تر)
  }).format(date);
};

export default function DayByDayPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pages_read: 0,
    sleep_hours: 0,
    sport_hours: 0,
    performance_score: 50,
    mood: 'good',
    favorite_song: '',
    current_book: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });
  const [logs, setLogs] = useState<any[]>([]);

  // استخراج سال و ماه شمسی امروز برای مقادیر پیش‌فرض فیلتر
  const todayShamsi = getShamsiDate(new Date());
  const [currentShYear, currentShMonth] = todayShamsi.split('/');

  const [selectedYear, setSelectedYear] = useState<string>(currentShYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentShMonth);

  const moodOptions = Object.keys(moodMap).map(key => ({
    value: key,
    label: moodMap[key].label,
    emoji: moodMap[key].emoji
  }));

  const fetchLogs = async () => {
    try {
      const response = await api.get('/daily-logs/');
      setLogs(response.data.reverse()); 
    } catch (error) {
      console.error("خطا در دریافت تاریخچه لاگ‌ها", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/daily-logs/', formData);
      setStatus({ type: 'success', message: 'گزارش امروزت با موفقیت ثبت شد! 🎉' });
      fetchLogs();
    } catch (error: any) {
      setStatus({ type: 'error', message: 'خطا در ثبت! شاید قبلاً برای این روز ثبت کرده باشی.' });
    } finally {
      setLoading(false);
    }
  };

  // ----- پردازش داده‌ها و افزودن تاریخ شمسی به لاگ‌ها -----
  const logsWithShamsi = useMemo(() => {
    return logs.map(log => {
      if (!log.date) return log;
      const shamsiFull = getShamsiDate(log.date); // مثلا 1403/02/15
      const [y, m, d] = shamsiFull.split('/');
      return { 
        ...log, 
        shamsiYear: y, 
        shamsiMonth: m, 
        shamsiDay: d,
        displayDate: `${m}/${d}` // برای نمایش زیباتر در محور X نمودارها
      };
    });
  }, [logs]);

  // فیلتر کردن لاگ‌ها بر اساس ماه و سال شمسی انتخاب شده
  const filteredLogs = useMemo(() => {
    return logsWithShamsi.filter(log => 
      log.shamsiYear === selectedYear && log.shamsiMonth === selectedMonth
    );
  }, [logsWithShamsi, selectedYear, selectedMonth]);

  const totalPagesRead = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0);
  }, [filteredLogs]);

  const moodCountsData = useMemo(() => {
    return Object.keys(moodMap).map(key => ({
      name: moodMap[key].emoji + ' ' + moodMap[key].label,
      count: filteredLogs.filter(log => log.mood === key).length
    }));
  }, [filteredLogs]);

  const availableYears = useMemo(() => {
    const years = logsWithShamsi.map(l => l.shamsiYear).filter(Boolean);
    const uniqueYears = Array.from(new Set(years)).sort();
    if (!uniqueYears.includes(currentShYear)) {
      uniqueYears.push(currentShYear);
    }
    return uniqueYears;
  }, [logsWithShamsi, currentShYear]);

  const shamsiMonths = [
    { value: '01', label: 'فروردین' }, { value: '02', label: 'اردیبهشت' }, { value: '03', label: 'خرداد' },
    { value: '04', label: 'تیر' }, { value: '05', label: 'مرداد' }, { value: '06', label: 'شهریور' },
    { value: '07', label: 'مهر' }, { value: '08', label: 'آبان' }, { value: '09', label: 'آذر' },
    { value: '10', label: 'دی' }, { value: '11', label: 'بهمن' }, { value: '12', label: 'اسفند' },
  ];

  return (
    <main className="min-h-screen bg-gray-50/30 p-6 md:p-12 max-w-4xl mx-auto space-y-8 pb-24 font-vazir">
      
      <header className="flex items-center gap-4">
        <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">روز به روز 🌞</h1>
          <p className="text-sm text-gray-500 mt-1">ثبت وقایع و حال و هوای امروز</p>
        </div>
      </header>
      {/* <FaalHafez /> */}
      {status.message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-50/50 border-green-200 text-green-700' : 'bg-red-50/50 border-red-200 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      {/* فرم لاگ روزانه */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" /> تاریخ گزارش
              </label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">حال و هوای امروزت؟</label>
              <div className="flex justify-between gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                {moodOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setFormData({...formData, mood: opt.value})} className={`text-2xl p-2 rounded-xl transition-all ${formData.mood === opt.value ? 'bg-white shadow-sm border border-gray-200 scale-110' : 'hover:bg-gray-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`} title={opt.label}>
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><BookOpen className="w-4 h-4 text-orange-500" />فرهنگیش</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1.5 ml-1">تعداد صفحات خوانده شده</span>
              <input type="number" min="0" value={formData.pages_read} onChange={(e) => setFormData({...formData, pages_read: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl px-4 py-2.5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1.5 ml-1">کتابی که در حال خواندنی</span>
              <input type="text" placeholder="نام کتاب..." value={formData.current_book} onChange={(e) => setFormData({...formData, current_book: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl px-4 py-2.5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 flex items-center gap-1 mb-1.5 ml-1"><Music className="w-3 h-3 text-pink-500"/> آهنگ مورد علاقه امروز</span>
              <input type="text" placeholder="نام آهنگ..." value={formData.favorite_song} onChange={(e) => setFormData({...formData, favorite_song: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl px-4 py-2.5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Moon className="w-4 h-4 text-indigo-500" /> ساعت خواب</label>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{formData.sleep_hours} ساعت</span>
              </div>
              <input type="range" min="0" max="15" step="0.5" value={formData.sleep_hours} onChange={(e) => setFormData({...formData, sleep_hours: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Dumbbell className="w-4 h-4 text-red-500" /> ساعت ورزش</label>
                <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">{formData.sport_hours} ساعت</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={formData.sport_hours} onChange={(e) => setFormData({...formData, sport_hours: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Activity className="w-4 h-4 text-green-500" /> امتیاز عملکرد امروز</label>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">{formData.performance_score} از ۱۰۰</span>
            </div>
            <input type="range" min="0" max="100" value={formData.performance_score} onChange={(e) => setFormData({...formData, performance_score: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-2">
          {loading ? 'در حال ثبت...' : <><Save className="w-5 h-5" /> ثبت گزارش امروز</>}
        </button>
      </form>

      {/* بخش داشبورد با تقویم شمسی */}
      {logs.length > 0 && (
        <div className="mt-12 space-y-6 border-t border-gray-200 pt-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold text-gray-800">داشبورد تحلیل</h2>
            </div>
            
            {/* فیلتر ماه و سال شمسی */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
              <Filter className="w-4 h-4 text-gray-400 ml-1" />
              <div className="flex items-center bg-gray-50 rounded-xl px-2">
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-2 pl-1 pr-6"
                >
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <span className="text-gray-300">/</span>
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-2 pl-1 pr-6"
                >
                  {shamsiMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 text-gray-500">
              رکوردی برای این ماه ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2 bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-3xl text-white shadow-lg shadow-orange-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-orange-100 font-medium mb-1">مجموع صفحات خوانده شده در این ماه</h3>
                  <div className="text-4xl font-black">{totalPagesRead} <span className="text-lg font-normal opacity-80">صفحه</span></div>
                </div>
                <BookOpen className="w-16 h-16 opacity-20" />
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
                <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  روند امتیاز عملکرد و حس و حال
                </h3>
                <div className="h-56 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredLogs} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="displayDate" tick={{fontSize: 10}} stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} tick={{fontSize: 10}} stroke="#9ca3af" />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line 
                        type="monotone" 
                        dataKey="performance_score" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={<CustomMoodDot />} 
                        activeDot={{ r: 8 }}
                        name="امتیاز" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  روند ساعت خواب
                </h3>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="displayDate" tick={{fontSize: 10}} stroke="#9ca3af" />
                      <YAxis domain={[0, 12]} tick={{fontSize: 10}} stroke="#9ca3af" />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="sleep_hours" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} name="ساعت خواب" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* نمودار جدید: روند ساعت ورزش */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-red-500" />
                  روند ساعت ورزش
                </h3>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="displayDate" tick={{fontSize: 10}} stroke="#9ca3af" />
                      <YAxis domain={[0, 10]} tick={{fontSize: 10}} stroke="#9ca3af" />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="sport_hours" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444'}} name="ساعت ورزش" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  روند مطالعه روزانه
                </h3>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="displayDate" tick={{fontSize: 10}} stroke="#9ca3af" />
                      <YAxis tick={{fontSize: 10}} stroke="#9ca3af" />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="pages_read" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316'}} name="صفحات" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-pink-500" />
                  فراوانی حس و حال در این ماه
                </h3>
                <div className="h-48 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodCountsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                      <YAxis allowDecimals={false} tick={{fontSize: 10}} stroke="#9ca3af" />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} name="تعداد روز" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </main>
  );
}
