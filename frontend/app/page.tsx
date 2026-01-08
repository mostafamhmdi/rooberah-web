"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { Wallet, TrendingDown, Calendar, CheckCircle, Plus, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import AddTransactionModal from '@/components/AddTransactionModal';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions/');
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // محاسبه هوشمند موجودی: درآمد (+) و هزینه (-)
  const totalBalance = transactions.reduce((acc, curr) => {
    if (curr.transaction_type === 'income') {
      return acc + curr.amount;
    } else {
      return acc - curr.amount;
    }
  }, 0);

  // تابع کمکی برای انتخاب آیکون بر اساس کتگوری
  const getIcon = (category: string) => {
    const map: Record<string, string> = {
      food: '🍔',
      transport: '🚕',
      shopping: '🛍️',
      bills: '📃',
      education: '📚',
      salary: '💰',      // اضافه شد
      freelance: '💻',   // اضافه شد
      gift: '🎁',        // اضافه شد
    };
    return map[category] || '💸'; // آیکون پیش‌فرض
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8 pb-24 font-vazir">
      
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">روبه‌راه 👋</h1>
          <p className="text-gray-500 mt-1">مدیریت هوشمند زندگی شخصی</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <Calendar className="w-6 h-6 text-brand-primary" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* کارت موجودی هوشمند */}
        <div className={`text-white p-6 rounded-3xl shadow-lg relative overflow-hidden transition-colors duration-500 ${totalBalance >= 0 ? 'bg-brand-primary shadow-brand-primary/20' : 'bg-red-500 shadow-red-500/20'}`}>
          <div className="relative z-10">
            <p className="opacity-90 mb-1">موجودی فعلی</p>
            <h2 className="text-4xl font-bold" dir="ltr">
              {totalBalance.toLocaleString()} <span className="text-lg font-normal">تومان</span>
            </h2>
          </div>
          <Wallet className="absolute -bottom-4 -left-4 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-brand-secondary w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-800">وضعیت امروز</h3>
          </div>
          <p className="text-gray-500">هنوز تسک‌های امروز را چک نکردی!</p>
        </div>
      </div>

      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <TrendingUp className="w-5 h-5 text-brand-primary" />
          تراکنش‌های اخیر
        </h3>

        {loading ? (
          <p className="text-center text-gray-400 py-10">در حال دریافت اطلاعات...</p>
        ) : (
          <div className="grid gap-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                هنوز تراکنشی ثبت نکردی!
              </div>
            ) : (
              transactions.map((t) => {
                const isIncome = t.transaction_type === 'income';
                return (
                  <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* آیکون با پس‌زمینه رنگی */}
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
                    <div className={`font-bold text-lg dir-ltr ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'}{t.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 left-8 bg-brand-primary text-white p-4 rounded-full shadow-lg shadow-brand-primary/40 hover:scale-110 transition-transform active:scale-95 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />

    </main>
  );
}