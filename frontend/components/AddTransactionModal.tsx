"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Check, CreditCard, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  
  // لیست‌های داینامیک که از سرور می‌گیریم
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "", // حالا اینجا ID ذخیره میشه
    account: "",  // اینجا هم ID
  });

  // دریافت لیست‌ها وقتی مودال باز می‌شود
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const cats = await api.get('/categories/');
          const accs = await api.get('/accounts/');
          setCategories(cats.data);
          setAccounts(accs.data);
          
          // ست کردن مقادیر پیش‌فرض (اولین آیتم لیست)
          if (cats.data.length > 0) setFormData(prev => ({ ...prev, category: cats.data[0].id }));
          if (accs.data.length > 0) setFormData(prev => ({ ...prev, account: accs.data[0].id }));
          
        } catch (e) {
          console.error("Error loading lists", e);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/transactions/", {
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category, // ارسال ID
        account: formData.account,   // ارسال ID
        transaction_type: type,
      });
      
      setFormData({ amount: "", description: "", category: "", account: "" });
      onSuccess(); 
      onClose();
    } catch (error) {
      alert("خطا در ثبت اطلاعات!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isExpense = type === 'expense';
  const themeColor = isExpense ? 'text-red-500' : 'text-brand-primary';
  const buttonColor = isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:bg-green-600';
  const ringColor = isExpense ? 'focus:ring-red-200' : 'focus:ring-green-200';

  // فیلتر کردن دسته‌بندی‌ها بر اساس نوع (هزینه/درآمد)
  const filteredCategories = categories.filter(c => c.cat_type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm transition-all">
      <div className="bg-white text-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/50">
        
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button 
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all font-bold text-sm
              ${isExpense ? 'text-red-500 bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            خرج کردم
          </button>
          <button 
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all font-bold text-sm
              ${!isExpense ? 'text-brand-primary bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            درآوردم
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block px-1">مبلغ (تومان)</label>
            <div className="relative">
                <input
                type="number"
                required
                placeholder="0"
                className={`w-full bg-gray-50 text-gray-800 text-3xl font-black tracking-tight p-5 rounded-2xl border-2 border-transparent outline-none transition placeholder:text-gray-300 ${ringColor} focus:bg-white focus:border-transparent focus:ring-4`}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* دسته‌بندی داینامیک */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block px-1">بابت چی؟</label>
              <select
                className="w-full bg-gray-50 p-3.5 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition text-sm font-medium appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="" disabled>انتخاب...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {/* حساب داینامیک */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block px-1">از کدوم حساب؟</label>
              <div className="relative">
                  <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full bg-gray-50 pl-9 pr-3 p-3.5 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition text-sm font-medium appearance-none"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  >
                     <option value="" disabled>انتخاب...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.title}</option>
                    ))}
                  </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block px-1">توضیحات</label>
            <input
              type="text"
              placeholder="توضیحات اختیاری..."
              className="w-full bg-gray-50 p-4 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-4 rounded-xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition">
              بی‌خیال
            </button>
            <button type="submit" disabled={loading} className={`flex-1 py-4 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition flex items-center justify-center gap-2 ${buttonColor} active:scale-95`}>
              {loading ? "..." : (isExpense ? "ثبت هزینه" : "ثبت درآمد")}
              {!loading && <Check className="w-5 h-5" />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}