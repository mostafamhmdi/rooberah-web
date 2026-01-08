"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Check, CreditCard, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "food",
    card: "mellat",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/transactions/", {
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category,
        card: formData.card,
        transaction_type: type,
      });
      
      setFormData({ amount: "", description: "", category: "food", card: "mellat" });
      onSuccess(); 
      onClose();
    } catch (error) {
      alert("خطا در ارتباط با سرور");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // تنظیم رنگ‌ها برای حالت روشن
  // اگر هزینه بود: قرمز / اگر درآمد بود: سبز برند (Brand Primary)
  const isExpense = type === 'expense';
  const activeColor = isExpense ? 'text-red-600' : 'text-brand-primary';
  const activeBg = isExpense ? 'bg-red-50' : 'bg-green-50';
  const activeBorder = isExpense ? 'border-red-500' : 'border-brand-primary';
  const buttonColor = isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:bg-green-600';
  const ringColor = isExpense ? 'focus:ring-red-200' : 'focus:ring-green-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all">
      {/* بدنه سفید و تمیز */}
      <div className="bg-white text-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* هدر: تب‌های انتخاب نوع */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setType('expense')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 transition font-medium text-sm
              ${isExpense ? 'text-red-600 bg-red-50 border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            چی خرج کردی؟
          </button>
          <button 
            onClick={() => setType('income')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 transition font-medium text-sm
              ${!isExpense ? 'text-brand-primary bg-green-50 border-b-2 border-brand-primary' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            چی درآوردی؟
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* ورودی مبلغ - بزرگ و خوانا */}
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">مبلغ (تومان)</label>
            <input
              type="number"
              required
              placeholder="0"
              className={`w-full bg-gray-50 text-gray-900 text-3xl font-bold p-4 rounded-2xl border-2 border-transparent outline-none transition placeholder:text-gray-300 ${ringColor} focus:bg-white focus:border-transparent focus:ring-4`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* دسته‌بندی */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">بابت چی؟</label>
              <select
                className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-300 transition text-sm"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {isExpense ? (
                  <>
                    <option value="food">🍔 خوراک</option>
                    <option value="transport">🚕 اسنپ/حمل‌ونقل</option>
                    <option value="shopping">🛍️ خرید</option>
                    <option value="bills">📃 قبض</option>
                    <option value="education">📚 آموزش</option>
                    <option value="other">🤷‍♂️ سایر</option>
                  </>
                ) : (
                  <>
                    <option value="salary">💰 حقوق</option>
                    <option value="freelance">💻 پروژه</option>
                    <option value="gift">🎁 هدیه</option>
                    <option value="other">📈 سایر</option>
                  </>
                )}
              </select>
            </div>

            {/* کارت */}
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">از کدوم حساب؟</label>
              <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    className="w-full bg-gray-50 pl-9 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-300 transition text-sm"
                    value={formData.card}
                    onChange={(e) => setFormData({ ...formData, card: e.target.value })}
                  >
                    <option value="mellat">بانک ملت</option>
                    <option value="refah">بانک رفاه</option>
                    <option value="cash">نقدی</option>
                  </select>
              </div>
            </div>
          </div>

          {/* شرح */}
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">توضیحات</label>
            <input
              type="text"
              placeholder={isExpense ? "مثلا: قهوه با بچه‌ها" : "مثلا: تسویه پروژه بهمن"}
              className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-300 transition"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition"
            >
              بی‌خیال
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition flex items-center justify-center gap-2 ${buttonColor}`}
            >
              {loading ? "..." : (isExpense ? "ثبت هزینه" : "ثبت درآمد")}
              {!loading && <Check className="w-5 h-5" />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}