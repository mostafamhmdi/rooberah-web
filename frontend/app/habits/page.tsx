"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Habit } from '@/types'; // فرض بر این است که longest_streak به این تایپ اضافه شده
import { CheckCircle2, Circle, Plus, ArrowRight, Target, Activity, ChevronRight, ChevronLeft, Flame } from 'lucide-react';
import Link from 'next/link';
import AddHabitModal from '@/components/AddHabitModal';
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => moment());

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habits/');
      setHabits(res.data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // تابع تغییر وضعیت برای امروز (دکمه‌های دایره‌ای بزرگ)
  const toggleHabitToday = async (habit: Habit) => {
    setHabits(habits.map(h => 
      h.id === habit.id ? { ...h, is_completed_today: !h.is_completed_today } : h
    ));

    try {
      await api.post(`/habits/${habit.id}/toggle_today/`);
      fetchHabits(); 
    } catch (error) {
      fetchHabits();
      console.error("Error toggling habit today:", error);
    }
  };

  // تابع جدید: تغییر وضعیت برای یک تاریخ خاص (کلیک روی مربع‌های ماتریس)
  const toggleHabitForDate = async (habitId: number, dateStr: string) => {
    try {
      // ارسال تاریخ خاص به بک‌اند برای تغییر وضعیت
      await api.post(`/habits/${habitId}/toggle_date/`, { date: dateStr });
      fetchHabits(); // دریافت مجدد اطلاعات برای آپدیت شدن رابط کاربری
    } catch (error) {
      console.error(`Error toggling habit for date ${dateStr}:`, error);
    }
  };

  const completedTodayCount = habits.filter(h => h.is_completed_today).length;

  const goToPreviousMonth = () => {
    setSelectedDate(prev => prev.clone().subtract(1, 'jMonth'));
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => prev.clone().add(1, 'jMonth'));
  };

  const getSelectedMonthDays = () => {
    const days = [];
    const year = selectedDate.jYear();
    const month = selectedDate.jMonth();
    const daysInMonth = moment.jDaysInMonth(year, month);
    const persianDays = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

    for (let i = 1; i <= daysInMonth; i++) {
      const d = moment(`${year}/${month + 1}/${i}`, 'jYYYY/jM/jD');
      days.push({
        dateStr: d.format('YYYY-MM-DD'),
        jDay: i,
        dayName: persianDays[d.day()]
      });
    }
    return days;
  };

  const monthDays = getSelectedMonthDays();
  const currentMonthName = selectedDate.format('jMMMM jYYYY');

  return (
    <main className="min-h-screen bg-gray-50/30 p-6 md:p-12 max-w-3xl mx-auto space-y-8 pb-24 font-vazir">
      
      <header className="flex items-center gap-4">
        <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-50 transition border border-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ردیاب عادات <Target className="w-6 h-6 text-orange-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            امروز {completedTodayCount} از {habits.length} عادتت رو انجام دادی
          </p>
        </div>
      </header>

      {/* بخش اول: لیست عادت‌ها */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">در حال لود کردن عادات...</p>
      ) : (
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-400">
              هنوز عادتی ثبت نکردی! وقتشه یه روتین جدید بسازی.
            </div>
          ) : (
            habits.map(habit => (
              <div 
                key={habit.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 group cursor-pointer
                  ${habit.is_completed_today 
                    ? 'border-green-200 bg-green-50/50 shadow-sm' 
                    : 'bg-white border-white shadow-sm hover:shadow-md'
                  }
                `}
                onClick={() => toggleHabitToday(habit)}
              >
                <div className="flex items-center gap-4 w-full">
                  <button className="focus:outline-none flex-shrink-0 z-10">
                    {habit.is_completed_today ? (
                      <CheckCircle2 className="w-8 h-8 text-green-500 transition-transform scale-110" />
                    ) : (
                      <Circle className="w-8 h-8 text-gray-300 hover:text-green-400 transition" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className={`font-bold text-lg transition-all ${
                        habit.is_completed_today ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {habit.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {habit.is_completed_today ? 'امروز انجام شد 🎉' : 'هنوز برای امروز تیک نخورده'}
                      </p>
                    </div>
                    
                    {/* نمایش بیشترین استریک */}
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 shrink-0">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-orange-600">
                        بهترین رکورد: {habit.longest_streak || 0} روز
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* بخش دوم: داشبورد نمایش عملکرد */}
      {habits.length > 0 && !loading && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col">
               <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                 <Activity className="w-5 h-5 text-purple-500" />
                 گزارش عملکرد
               </h3>
               <span className="text-xs text-gray-400 mt-1">برای ثبت روزهای گذشته، روی مربع‌ها کلیک کنید</span>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-200 rounded-md text-gray-600 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-gray-700 min-w-[100px] text-center">
                {currentMonthName}
              </span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-gray-200 rounded-md text-gray-600 transition" disabled={selectedDate.isSame(moment(), 'jMonth')}>
                <ChevronLeft className={`w-4 h-4 ${selectedDate.isSame(moment(), 'jMonth') ? 'opacity-30' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {habits.map((habit) => (
              <div key={habit.id} className="flex flex-col gap-2">
                <span className="font-medium text-sm text-gray-700">{habit.name}</span>
                
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide dir-ltr justify-end">
                  {monthDays.map((dayObj) => {
                    const log = habit.recent_logs?.find(l => l.date === dayObj.dateStr);
                    const isCompleted = log ? log.is_completed : false;
                    
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isToday = dayObj.dateStr === todayStr;
                    const isFuture = dayObj.dateStr > todayStr;

                    return (
                      <div 
                        key={dayObj.dateStr}
                        title={`${dayObj.dayName} ${dayObj.jDay} ${currentMonthName.split(' ')[0]}`}
                        // اضافه شدن رویداد کلیک برای تاریخ‌های گذشته و امروز
                        onClick={() => {
                          if (!isFuture) toggleHabitForDate(habit.id, dayObj.dateStr);
                        }}
                        className={`min-w-[14px] h-[14px] rounded-[3px] transition-all 
                          ${isCompleted ? 'bg-purple-500 shadow-sm' : isFuture ? 'bg-gray-50 border border-gray-50' : 'bg-gray-100'} 
                          ${isToday ? 'ring-2 ring-offset-1 ring-purple-300' : ''}
                          ${!isFuture ? 'cursor-pointer hover:scale-125 hover:bg-purple-300' : 'cursor-not-allowed opacity-50'}
                        `}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/40 hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchHabits} 
      />
    </main>
  );
}


