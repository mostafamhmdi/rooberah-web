"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Check, CreditCard, ArrowDownCircle, ArrowUpCircle, Plus, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // State های مربوط به افزودن حساب
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // State های مربوط به افزودن دسته‌بندی
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ title: "", icon: "⚪" });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "", 
    account: "", 
  });
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  const fetchData = async () => {
    try {
      setLoading(true); // لودینگ کلی برای دریافت اطلاعات اولیه
      const cats = await api.get('/categories/');
      const accs = await api.get('/accounts/');
      setCategories(cats.data);
      setAccounts(accs.data);
      
      // ست کردن مقدار پیش‌فرض فقط برای حساب
      if (accs.data.length > 0 && !formData.account) {
          setFormData(prev => ({ ...prev, account: accs.data[0].id }));
      }
      
    } catch (e) {
      console.error("Error loading lists", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // انتخاب دسته‌بندی پیش‌فرض بعد از فیلتر شدن
  useEffect(() => {
    const filtered = categories.filter(c => c.cat_type === type);
    if (filtered.length > 0) {
      setFormData(prev => ({ ...prev, category: filtered[0].id }));
    } else {
       setFormData(prev => ({ ...prev, category: "" })); // اگر دسته‌بندی نبود خالی شود
    }
  }, [type, categories]);


  // تابع ایجاد حساب جدید
  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return;
    setIsSavingAccount(true);
    try {
      const response = await api.post("/accounts/", { title: newAccountName });
      const newAccount = response.data;
      setAccounts(prev => [...prev, newAccount]);
      setFormData(prev => ({ ...prev, account: newAccount.id }));
      setNewAccountName("");
      setIsAddingAccount(false);
    } catch (error) {
      alert("خطا در ایجاد حساب جدید!");
      console.error(error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  // تابع ایجاد دسته‌بندی جدید
  const handleAddCategory = async () => {
    if (!newCategoryData.title.trim()) return;
    setIsSavingCategory(true);
    try {
      const payload = {
        title: newCategoryData.title,
        icon: newCategoryData.icon || "⚪", // اگر ایموجی خالی بود، پیش‌فرض بفرست
        cat_type: type, // cat_type بر اساس تب فعال (خرج یا درآمد) تنظیم می‌شود
      };
      const response = await api.post("/categories/", payload);
      const newCategory = response.data;
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory.id }));
      setNewCategoryData({ title: "", icon: "⚪" });
      setIsAddingCategory(false);
    } catch (error) {
      alert("خطا در ایجاد دسته‌بندی جدید!");
      console.error(error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/transactions/", {
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category,
        account: formData.account,
        transaction_type: type,
        date: date + "T12:00:00Z"
      });
      
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
  const buttonColor = isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:bg-green-600';
  const ringColor = isExpense ? 'focus:ring-red-200' : 'focus:ring-green-200';

  const filteredCategories = categories.filter(c => c.cat_type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm transition-all">
      <div className="bg-white text-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/50">
        
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button 
            type="button"
            onClick={() => { setType('expense'); setIsAddingCategory(false); }}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all font-bold text-sm ${isExpense ? 'text-red-500 bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`} >
            <ArrowDownCircle className="w-5 h-5" /> خرج کردم
          </button>
          <button 
            type="button"
            onClick={() => { setType('income'); setIsAddingCategory(false); }}
            className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all font-bold text-sm ${!isExpense ? 'text-brand-primary bg-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`} >
            <ArrowUpCircle className="w-5 h-5" /> درآوردم
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block px-1">مبلغ (تومان)</label>
            <input
              type="number" required placeholder="0"
              className={`w-full bg-gray-50 text-gray-800 text-3xl font-black tracking-tight p-5 rounded-2xl border-2 border-transparent outline-none transition placeholder:text-gray-300 ${ringColor} focus:bg-white focus:border-transparent focus:ring-4`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* بخش دسته‌بندی با قابلیت افزودن */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <label className="text-xs font-bold text-gray-400">بابت چی؟</label>
                {!isAddingCategory && (
                  <button type="button" onClick={() => setIsAddingCategory(true)} className="text-[10px] text-blue-500 font-bold hover:text-blue-700 flex items-center gap-0.5" >
                    <Plus className="w-3 h-3" /> جدید
                  </button>
                )}
              </div>
              {isAddingCategory ? (
                <div className="flex items-center gap-1">
                    <input type="text" value={newCategoryData.icon} onChange={(e) => setNewCategoryData(prev => ({...prev, icon: e.target.value}))} maxLength={2} className="w-12 text-center bg-gray-50 p-[10px] rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-blue-500 text-sm font-medium"/>
                    <input type="text" placeholder="عنوان..." value={newCategoryData.title} onChange={(e) => setNewCategoryData(prev => ({...prev, title: e.target.value}))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }} autoFocus className="flex-1 w-full bg-gray-50 p-[10px] rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-blue-500 text-sm font-medium"/>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={handleAddCategory} disabled={isSavingCategory || !newCategoryData.title.trim()} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center">
                        {isSavingCategory ? "..." : <Check className="w-3 h-3" />}
                      </button>
                      <button type="button" onClick={() => { setIsAddingCategory(false); setNewCategoryData({ title: "", icon: "⚪" }); }} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                </div>
              ) : (
                <select className="w-full bg-gray-50 p-3.5 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition text-sm font-medium appearance-none" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="" disabled>انتخاب...</option>
                  {filteredCategories.map(cat => ( <option key={cat.id} value={cat.id}> {cat.icon} {cat.title} </option> ))}
                </select>
              )}
            </div>

            {/* بخش حساب با قابلیت افزودن */}
            <div>
              <div className="flex justify-between items-center mb-1 px-1">
                <label className="text-xs font-bold text-gray-400">از کدوم حساب؟</label>
                {!isAddingAccount && (
                  <button type="button" onClick={() => setIsAddingAccount(true)} className="text-[10px] text-blue-500 font-bold hover:text-blue-700 flex items-center gap-0.5" >
                    <Plus className="w-3 h-3" /> جدید
                  </button>
                )}
              </div>
              {isAddingAccount ? (
                <div className="flex items-center gap-1">
                  <input type="text" placeholder="نام حساب..." value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAccount(); } }} autoFocus className="w-full bg-gray-50 p-[10px] rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-blue-500 text-sm font-medium"/>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={handleAddAccount} disabled={isSavingAccount || !newAccountName.trim()} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center">
                      {isSavingAccount ? "..." : <Check className="w-3 h-3" />}
                    </button>
                    <button type="button" onClick={() => { setIsAddingAccount(false); setNewAccountName(""); }} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                    <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select className="w-full bg-gray-50 pl-9 pr-3 p-3.5 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition text-sm font-medium appearance-none" value={formData.account} onChange={(e) => setFormData({ ...formData, account: e.target.value })}>
                       <option value="" disabled>انتخاب...</option>
                      {accounts.map(acc => ( <option key={acc.id} value={acc.id}>{acc.title}</option> ))}
                    </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">تاریخ تراکنش</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500" />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block px-1">توضیحات</label>
            <input type="text" placeholder="توضیحات اختیاری..." className="w-full bg-gray-50 p-4 rounded-xl border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition font-medium" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-6 py-4 rounded-xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition"> بی‌خیال </button>
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
