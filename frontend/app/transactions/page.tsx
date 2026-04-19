"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
// import { Transaction } from '@/types'; // در صورت نیاز تایپ‌ها را آپدیت کنید
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, CreditCard, Calendar, PieChart as PieChartIcon, AlignRight } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import moment from 'moment-jalaali';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, any>>({});
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // فیلترها
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(moment().jYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(moment().jMonth() + 1);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // دریافت همزمان تراکنش‌ها، حساب‌ها و دسته‌بندی‌ها
        const [txRes, catRes, accRes] = await Promise.all([
          api.get('/transactions/'),
          api.get('/categories/').catch(() => ({ data: [] })),
          api.get('/accounts/').catch(() => ({ data: [] }))
        ]);
        
        setTransactions(txRes.data);

        // تبدیل آرایه دسته‌بندی‌ها به یک دیکشنری برای دسترسی سریع با ID
        const catMap: Record<string, any> = {};
        catRes.data.forEach((c: any) => { catMap[c.id] = c; });
        setCategories(catMap);

        // تبدیل آرایه حساب‌ها به یک دیکشنری برای دسترسی سریع با ID
        const accMap: Record<string, any> = {};
        accRes.data.forEach((a: any) => { accMap[a.id] = a; });
        setAccounts(accMap);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // توابع کمکی هوشمند برای استخراج اطلاعات (پشتیبانی از زمانی که بک‌اند آبجکت بدهد یا فقط ID)
  const getCatObj = (cat: any) => typeof cat === 'object' && cat !== null ? cat : (categories[cat] || {});
  const getAccObj = (acc: any) => typeof acc === 'object' && acc !== null ? acc : (accounts[acc] || {});

  const getCatName = (cat: any) => getCatObj(cat).title || 'نامشخص';
  const getAccName = (acc: any) => getAccObj(acc).title || 'نامشخص';
  const getCatIcon = (cat: any) => getCatObj(cat).icon || '💸';

  // ۱. اعمال فیلترها
  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.transaction_type !== filterType) return false;
    
    const catId = typeof t.category === 'object' && t.category ? t.category.id : t.category;
    const accId = typeof t.account === 'object' && t.account ? t.account.id : t.account;

    if (selectedAccount !== 'all' && String(accId) !== selectedAccount) return false;
    if (selectedCategory !== 'all' && String(catId) !== selectedCategory) return false;
    
    const tDate = moment(t.date.split('T')[0], 'YYYY-MM-DD');
    if (tDate.jYear() !== selectedYear) return false;
    if (tDate.jMonth() + 1 !== selectedMonth) return false;

    return true;
  });

  // ۲. تولید دیتای نمودار خطی
  const getLineChartData = () => {
    const data = [];
    const daysInMonth = moment.jDaysInMonth(selectedYear, selectedMonth - 1); 

    for (let i = 1; i <= daysInMonth; i++) {
      const mDate = moment(`${selectedYear}/${selectedMonth}/${i}`, 'jYYYY/jM/jD');
      const dateStr = mDate.format('YYYY-MM-DD'); // معادل تاریخ میلادی برای مقایسه
      
      const dayTransactions = filteredTransactions.filter(t => t.date.split('T')[0] === dateStr);
      
      const expenseAmount = dayTransactions.filter(t => t.transaction_type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      const incomeAmount = dayTransactions.filter(t => t.transaction_type === 'income').reduce((acc, curr) => acc + curr.amount, 0);

      data.push({
        date: `${i} ${JALALI_MONTHS[selectedMonth - 1]}`,
        expense: expenseAmount,
        income: incomeAmount,
      });
    }
    return data;
  };

  // ۳. تولید دیتای نمودار دایره‌ای
  const getPieChartData = (type: 'income' | 'expense') => {
    const typeTransactions = filteredTransactions.filter(t => t.transaction_type === type);
    const grouped = typeTransactions.reduce((acc, t) => {
      const catName = getCatName(t.category);
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => b.value - a.value);
  };

  const lineChartData = getLineChartData();
  const expensePieData = getPieChartData('expense');
  const incomePieData = getPieChartData('income');
  const availableYears = [moment().jYear() - 2, moment().jYear() - 1, moment().jYear()];

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8 font-vazir pb-24">
      
      {/* <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">گزارشات و تحلیل تراکنش‌ها</h1>
        </div>
      </header> */}
      <header className="flex justify-end items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">گزارشات و تحلیل تراکنش‌ها</h1>
            <Link href="/" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
        </div>
        </header>


      {/* بخش فیلترهای پیشرفته */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 font-bold flex items-center gap-1"><Calendar className="w-3 h-3"/> زمان</label>
          <div className="flex gap-2">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              {JALALI_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 font-bold flex items-center gap-1"><CreditCard className="w-3 h-3"/> حساب بانکی</label>
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]">
            <option value="all">همه حساب‌ها</option>
            {Object.values(accounts).map((acc: any) => <option key={acc.id} value={String(acc.id)}>{acc.title}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 font-bold flex items-center gap-1"><AlignRight className="w-3 h-3"/> دسته‌بندی</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]">
            <option value="all">همه دسته‌ها</option>
            {Object.values(categories).map((cat: any) => <option key={cat.id} value={String(cat.id)}>{cat.title}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2 mr-auto mt-4 sm:mt-0">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>همه</button>
            <button onClick={() => setFilterType('income')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'income' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'}`}>درآمد</button>
            <button onClick={() => setFilterType('expense')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'}`}>هزینه</button>
          </div>
        </div>
      </section>

      {/* بخش نمودارها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* نمودار خطی روند */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 text-gray-800">روند مالی در {JALALI_MONTHS[selectedMonth - 1]} {selectedYear}</h3>
          <div className="w-full h-72 mt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} تومان`, name === 'expense' ? 'هزینه' : 'درآمد']} labelStyle={{color: '#666'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend formatter={(value) => value === 'expense' ? 'هزینه' : 'درآمد'} />
                {filterType !== 'income' && <Line type="monotone" name="expense" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                {filterType !== 'expense' && <Line type="monotone" name="income" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* نمودارهای دایره‌ای */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-blue-500"/> ترکیب دسته‌بندی‌ها</h3>
          
          {filterType !== 'income' && (
            <div className="flex-1 flex flex-col items-center border-b border-gray-100 pb-4">
              <span className="text-sm font-bold text-gray-500 mb-2">هزینه‌ها</span>
              {expensePieData.length > 0 ? (
                <div className="w-full h-40" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensePieData} innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                        {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} تومان`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-gray-400 my-auto">داده‌ای موجود نیست</p>}
            </div>
          )}

          {filterType !== 'expense' && (
            <div className="flex-1 flex flex-col items-center pt-2">
              <span className="text-sm font-bold text-gray-500 mb-2">درآمدها</span>
              {incomePieData.length > 0 ? (
                <div className="w-full h-40" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incomePieData} innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                        {incomePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} تومان`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-xs text-gray-400 my-auto">داده‌ای موجود نیست</p>}
            </div>
          )}
        </section>
      </div>

      {/* لیست تراکنش‌ها */}
      <section>
        <h3 className="text-lg font-bold mb-4 text-gray-800">جزئیات تراکنش‌ها</h3>
        {loading ? (
          <p className="text-center text-gray-400 py-10">در حال دریافت اطلاعات...</p>
        ) : (
          <div className="grid gap-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
                تراکنشی با این فیلترها یافت نشد.
              </div>
            ) : (
              filteredTransactions.map((t) => {
                const isIncome = t.transaction_type === 'income';
                const shamsiDate = moment(t.date.split('T')[0], 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
                const catName = getCatName(t.category);
                const accName = getAccName(t.account);
                
                return (
                  <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center text-2xl ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
                        {getCatIcon(t.category)}
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* نمایش مبلغ در موبایل */}
                        <div className="flex sm:hidden font-bold text-lg dir-ltr w-fit justify-end text-left mr-auto mb-1">
                          <span className={isIncome ? 'text-green-600' : 'text-red-500'}>
                            {isIncome ? '+' : '-'}{t.amount.toLocaleString()} تومان
                          </span>
                        </div>
                        
                        {/* شرح تراکنش */}
                        <p className="font-bold text-gray-800 text-base">
                          {t.description || (isIncome ? 'ثبت درآمد' : 'ثبت هزینه')}
                        </p>
                        
                        {/* تگ‌های اطلاعاتی: دسته‌بندی، کارت، تاریخ */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${isIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {isIncome ? <ArrowUpCircle className="w-3.5 h-3.5"/> : <ArrowDownCircle className="w-3.5 h-3.5"/>}
                            {catName}
                          </span>
                          
                          {accName && accName !== 'نامشخص' && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                              <CreditCard className="w-3 h-3" />
                              {accName}
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-md" dir="ltr">
                            {shamsiDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* مبلغ در دسکتاپ */}
                    <div className={`hidden sm:block font-bold text-lg whitespace-nowrap dir-ltr ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'}{t.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </main>
  );
}
