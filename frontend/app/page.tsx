"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Transaction, Task } from '@/types';
// آیکون‌های Pencil و Trash2 اضافه شدند
import { Wallet, TrendingDown, Calendar, CheckCircle, Plus, TrendingUp, ArrowUpCircle, ArrowDownCircle, ArrowLeft, Activity, Check, Sun, Pencil, Trash2  } from 'lucide-react';
import Link from 'next/link';
import AddTransactionModal from '@/components/AddTransactionModal';
import moment from 'moment-jalaali';

export interface HabitLog {
  date: string;
  is_completed: boolean;
}

export interface Habit {
  id: number;
  name: string;
  is_active: boolean;
  is_completed_today: boolean;
  recent_logs: HabitLog[];
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // مدیریت مودال و ویرایش تراکنش
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, tasksRes, habitsRes] = await Promise.all([
        api.get('/transactions/'),
        api.get('/tasks/'),
        api.get('/habits/') 
      ]);
      setTransactions(transRes.data);
      setTasks(tasksRes.data);
      setHabits(habitsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleHabitToday = async (habitId: number) => {
    try {
      setHabits(prevHabits => 
        prevHabits.map(h => 
          h.id === habitId ? { ...h, is_completed_today: !h.is_completed_today } : h
        )
      );
      await api.post(`/habits/${habitId}/toggle_today/`);
      fetchData();
    } catch (error) {
      console.error("Error toggling habit:", error);
      fetchData(); 
    }
  };

  // 🔴 تابع حذف تراکنش
  const handleDeleteTransaction = async (id: number | undefined) => {
    if (!id) return;
    
    // تاییدیه گرفتن از کاربر قبل از حذف
    if (window.confirm('آیا از حذف این تراکنش مطمئن هستید؟')) {
      try {
        await api.delete(`/transactions/${id}/`);
        // به‌روزرسانی لیست بعد از حذف موفق
        fetchData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert('خطا در حذف تراکنش. لطفا دوباره تلاش کنید.');
      }
    }
  };

  // 🔴 باز کردن مودال برای ویرایش
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  // باز کردن مودال برای ایجاد تراکنش جدید
  const handleAddNewTransaction = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  const startOfJalaliMonth = moment().startOf('jMonth');
  const endOfJalaliMonth = moment().endOf('jMonth');

  const currentMonthTransactions = transactions.filter(t => {
    const tDate = moment(t.date); 
    return tDate.isSameOrAfter(startOfJalaliMonth) && tDate.isSameOrBefore(endOfJalaliMonth);
  });

  const totalBalance = currentMonthTransactions.reduce((acc, curr) => {
    if (curr.transaction_type === 'income') {
      return acc + curr.amount;
    } else {
      return acc - curr.amount;
    }
  }, 0);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.is_done).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const getIcon = (category: string) => {
    const map: Record<string, string> = {
      food: '🍔',
      transport: '🚕',
      shopping: '🛍️',
      bills: '📃',
      education: '📚',
      salary: '💰',
      freelance: '💻',
      gift: '🎁',
    };
    return map[category] || '💸';
  };

  const getCurrentJalaliMonthDays = () => {
    const days = [];
    const today = moment();
    const daysInMonth = moment.jDaysInMonth(today.jYear(), today.jMonth());
    const persianDays = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

    for (let i = 1; i <= daysInMonth; i++) {
      const d = moment(`${today.jYear()}/${today.jMonth() + 1}/${i}`, 'jYYYY/jM/jD');
      days.push({
        dateStr: d.format('YYYY-MM-DD'),
        jDay: i,
        dayName: persianDays[d.day()]
      });
    }
    return days;
  };

  const currentMonthDays = getCurrentJalaliMonthDays();  
  
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8 pb-24 font-vazir">
      
      <header className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">روبه‌راه 👋</h1>
      <p className="text-gray-500 mt-1">داریم چه غلطی با زندگیمون میکنیم؟</p>
    </div>
    
    {/* تبدیل div به Link برای هدایت به صفحه /doings */}
    <Link 
      href="/doings" 
      className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:-translate-y-0.5 transition-all cursor-pointer"
      title="مشاهده انجام دادنی‌ها"
    >
      <Calendar className="w-6 h-6 text-brand-primary" />
    </Link>
  </header>


      {/* بخش کارت‌های بالا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... (کدهای کارت موجودی و تسک‌ها بدون تغییر) ... */}
        <div className={`text-white p-6 rounded-3xl shadow-lg relative overflow-hidden transition-colors duration-500 ${totalBalance >= 0 ? 'bg-brand-primary shadow-brand-primary/20' : 'bg-red-500 shadow-red-500/20'}`}>
          <div className="relative z-10">
            <p className="opacity-90 mb-1">موجودی فعلی</p>
            <h2 className="text-4xl font-bold" dir="ltr">
              {totalBalance.toLocaleString()} <span className="text-lg font-normal">تومان</span>
            </h2>
          </div>
          <Wallet className="absolute -bottom-4 -left-4 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <Link href="/tasks" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">تسک‌های من</h3>
                <p className="text-xs text-gray-400 font-medium">{doneTasks} از {totalTasks} انجام شده</p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors group-hover:-translate-x-1" />
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs font-bold text-blue-500 mt-2 text-left" dir="ltr">{progressPercent}%</p>
        </Link>
      </div>

      <Link href="/daily" className="block bg-gradient-to-r from-amber-400 to-orange-500 p-6 rounded-3xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden">
        {/* ... (کد روز به روز بدون تغییر) ... */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">روز به روز</h3>
              <p className="text-orange-50 mt-1 text-sm font-medium">ثبت حال و هوا و علمکرد امروز</p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:-translate-x-2 transition-transform">
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
      </Link>

      {/* بخش ردیاب عادت‌ها */}
      <section>
        {/* ... (کد عادت‌ها بدون تغییر) ... */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Activity className="w-5 h-5 text-purple-500" />
            ردیاب عادت
          </h3>
          <Link href="/habits" className="text-sm font-medium text-purple-500 hover:text-purple-600">
            مدیریت »
          </Link>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          {loading ? (
            <p className="text-center text-gray-400 py-4 text-sm">در حال بارگذاری...</p>
          ) : habits.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              هنوز عادتی ثبت نکرده‌اید!
            </p>
          ) : (
            <div className="space-y-6">
              {habits.map((habit) => (
                <div key={habit.id} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">{habit.name}</span>
                    <button 
                      onClick={() => toggleHabitToday(habit.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        habit.is_completed_today 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {habit.is_completed_today ? 'انجام شد' : 'ثبت امروز'}
                    </button>
                  </div>

                   <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide dir-ltr justify-end">
                    {currentMonthDays.map((dayObj) => {
                      const log = habit.recent_logs.find(l => l.date === dayObj.dateStr);
                      const isCompleted = log ? log.is_completed : false;
                      const isToday = dayObj.dateStr === new Date().toISOString().split('T')[0];

                      return (
                        <div 
                          key={dayObj.dateStr}
                          title={`${dayObj.dayName} ${dayObj.jDay}`}
                          className={`min-w-[14px] h-[14px] rounded-[3px] transition-colors cursor-help ${
                            isCompleted 
                              ? 'bg-purple-500' 
                              : 'bg-gray-100' 
                          } ${isToday ? 'ring-2 ring-offset-1 ring-purple-300' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* بخش تراکنش‌های اخیر */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            تراکنش‌های اخیر
          </h3>
          <Link href="/transactions" className="text-sm font-medium text-brand-primary hover:text-blue-600">
            همه تراکنش‌ها »
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-10">در حال دریافت اطلاعات...</p>
        ) : (
          <div className="grid gap-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
                هنوز تراکنشی ثبت نکردی!
              </div>
            ) : (
              transactions.slice(0, 10).map((t) => {
                const isIncome = t.transaction_type === 'income';
                return (
                  // 🔴 اضافه شدن کلاس group به این div
                  <div key={t.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
                        {getIcon(t.category)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{t.description || (isIncome ? 'درآمد' : 'هزینه')}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          {isIncome ? <ArrowUpCircle className="w-3 h-3 text-green-500"/> : <ArrowDownCircle className="w-3 h-3 text-red-500"/>}
                          <span>{t.category}</span>
                          <span className="mx-1">•</span>
                          <span>{t.card === 'mellat' ? 'ملت' : t.card}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 🔴 بخش دکمه‌های عملیات و مبلغ */}
                    <div className="flex items-center gap-3">
                      {/* دکمه‌های ویرایش و حذف که در حالت عادی مخفی هستند (opacity-0) و با هاور نمایان می‌شوند */}
                      <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditTransaction(t)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش تراکنش"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف تراکنش"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className={`font-bold text-lg dir-ltr ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{t.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* 🔴 دکمه افزودن تراکنش جدید */}
      <button
        onClick={handleAddNewTransaction}
        className="fixed bottom-8 left-8 bg-brand-primary text-white p-4 rounded-full shadow-lg shadow-brand-primary/40 hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* 🔴 مودال که حالا prop جدیدی برای ویرایش دریافت می‌کند */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null); // پاک کردن استیت بعد از بسته شدن مودال
        }} 
        onSuccess={fetchData} 
        initialData={transactionToEdit} // ارسال اطلاعات تراکنش برای ویرایش
      />

    </main>
  );
}

