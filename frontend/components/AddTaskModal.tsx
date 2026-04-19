"use client";

import React, { useState, useEffect } from 'react';
import { Plus, X, Check } from "lucide-react";

interface Goal { id: number; title: string; }
interface Task { id: number; title: string; }
interface Category { id: number; title: string; color: string; }

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// لیست رنگ‌ها دقیقاً مطابق COLOR_CHOICES در مدل جنگو
const colorOptions = [
  { value: 'purple', label: 'بنفش', bgClass: 'bg-purple-500' },
  { value: 'blue', label: 'آبی', bgClass: 'bg-blue-500' },
  { value: 'green', label: 'سبز', bgClass: 'bg-green-500' },
  { value: 'yellow', label: 'زرد', bgClass: 'bg-yellow-400' },
  { value: 'orange', label: 'نارنجی', bgClass: 'bg-orange-500' },
  { value: 'red', label: 'قرمز', bgClass: 'bg-red-500' },
  { value: 'gray', label: 'خاکستری', bgClass: 'bg-gray-500' },
];

export default function AddTaskModal({ isOpen, onClose, onSuccess }: AddTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'goal' | 'task'>('task');
  const [loading, setLoading] = useState(false);
  
  // استیت‌های فرم اصلی
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  // استیت‌های مخصوص تسک
  const [goalId, setGoalId] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [isFrog, setIsFrog] = useState(false);
  const [dependsOn, setDependsOn] = useState<string>('');

  // استیت‌های داده‌های سرور
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // --- استیت‌های مربوط به ساخت دسته‌بندی جدید ---
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatColor, setNewCatColor] = useState('gray');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api';

  const fetchDropdownData = async () => {
    try {
      const [resGoals, resTasks, resCategories] = await Promise.all([
        fetch(`${API_BASE}/goals/`),
        fetch(`${API_BASE}/tasks/`),
        fetch(`${API_BASE}/task-categories/`) 
      ]);
      
      const dataGoals = await resGoals.json();
      const dataTasks = await resTasks.json();
      const dataCategories = await resCategories.json();

      setGoals(dataGoals);
      setTasks(dataTasks);
      setCategories(dataCategories);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات دیتابیس:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setCategoryId('');
    setGoalId('');
    setEnergyLevel('medium');
    setIsFrog(false);
    setDependsOn('');
    setIsAddingCategory(false);
  };

  // تابع ذخیره دسته‌بندی جدید در دیتابیس
  const handleSaveNewCategory = async () => {
    if (!newCatTitle.trim()) return;
    setIsSavingCategory(true);

    try {
      // دقت کنید که در اینجا فرض شده آدرس ساخت کتگوری مطابق نام‌گذاری RESTful است
      const res = await fetch(`${API_BASE}/task-categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // آیدی یوزر باید توسط بک‌اند از توکن/سشن خوانده شود، بنابراین در اینجا فقط دیتا می‌فرستیم
        body: JSON.stringify({ title: newCatTitle, color: newCatColor })
      });

      if (res.ok) {
        const newCategory = await res.json();
        // اضافه کردن مستقیم به استیت برای سرعت بالا و انتخاب خودکار آن
        setCategories(prev => [...prev, newCategory]);
        setCategoryId(newCategory.id.toString());
        
        // بستن فرم افزودن کتگوری و ریست کردن فیلدها
        setIsAddingCategory(false);
        setNewCatTitle('');
        setNewCatColor('gray');
      } else {
        console.error("خطا در ثبت دسته‌بندی");
      }
    } catch (error) {
      console.error("خطای شبکه در ثبت دسته‌بندی:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const commonPayload = {
      title,
      due_date: dueDate || null,
      category: categoryId ? parseInt(categoryId) : null,
    };

    try {
      if (activeTab === 'goal') {
        const res = await fetch(`${API_BASE}/goals/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commonPayload)
        });

        if (res.ok) {
          const newGoal = await res.json();
          await fetchDropdownData();
          setGoalId(newGoal.id.toString());
          setTitle('');
          setDueDate('');
          setCategoryId(newGoal.category?.toString() || '');
          setActiveTab('task');
        }
      } else {
        const taskPayload = {
          ...commonPayload,
          goal: goalId ? parseInt(goalId) : null,
          energy_level: energyLevel,
          is_frog_today: isFrog,
          depends_on: dependsOn ? parseInt(dependsOn) : null,
        };

        const res = await fetch(`${API_BASE}/tasks/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskPayload)
        });
        
        if (res.ok) {
          resetForm();
          onSuccess();
        }
      }
    } catch (error) {
      console.error(`خطا در ثبت ${activeTab === 'goal' ? 'هدف' : 'تسک'}`, error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center p-4 pb-0">
            <h2 className="text-xl font-bold text-gray-800">ایجاد انجام‌دادنی جدید</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-3xl leading-none mb-2">&times;</button>
          </div>
          
          <div className="flex px-4 mt-2">
            <button 
              onClick={() => setActiveTab('goal')}
              className={`flex-1 py-3 text-center border-b-2 font-semibold transition-colors ${activeTab === 'goal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
            >
               ۱. تعریف هدف
            </button>
            <button 
              onClick={() => setActiveTab('task')}
              className={`flex-1 py-3 text-center border-b-2 font-semibold transition-colors ${activeTab === 'task' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
            >
               ۲. تعریف تسک
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {activeTab === 'goal' ? 'عنوان هدف' : 'عنوان تسک'}
            </label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={activeTab === 'goal' ? "مثلا: راه‌اندازی نسخه اولیه اپلیکیشن" : "مثلا: طراحی دیتابیس کاربران"}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
            />
          </div>

          {/* ====== بخش مدیریت دسته‌بندی ====== */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            {isAddingCategory ? (
              // فرم ایجاد دسته‌بندی جدید (Inline)
              <div className="space-y-3 animate-fade-in">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-blue-700">افزودن دسته‌بندی جدید</label>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCategory(false)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <input 
                  type="text" 
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  placeholder="نام دسته‌بندی (مثلا: شرکت، شخصی...)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  autoFocus
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">رنگ:</span>
                  <div className="flex gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewCatColor(color.value)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color.bgClass} ${newCatColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        title={color.label}
                      >
                        {newCatColor === color.value && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={!newCatTitle.trim() || isSavingCategory}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingCategory ? 'در حال ذخیره...' : 'ذخیره دسته‌بندی'}
                </button>
              </div>
            ) : (
              // نمایش دراپ‌داون انتخاب دسته‌بندی
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1">دسته‌بندی (اختیاری)</label>
                <div className="flex gap-2">
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  >
                    <option value="">بدون دسته‌بندی</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                         {cat.title}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCategory(true)}
                    className="p-3 bg-white border border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-xl text-gray-600 transition-all flex items-center justify-center"
                    title="افزودن دسته‌بندی جدید"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
          {/* ============================================================= */}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">تاریخ مهلت انجام</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
            />
          </div>

          {/* Fields for Task Tab */}
          {activeTab === 'task' && (
            <div className="space-y-4 animate-fade-in border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">هدف مرتبط (انتخاب کنید)</label>
                <select 
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                >
                  <option value="">تسک مستقل (بدون هدف)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>🎯 {g.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">سطح انرژی مورد نیاز</label>
                  <select 
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  >
                    <option value="high">⚡️ بالا (تمرکز عمیق)</option>
                    <option value="medium">🔋 متوسط</option>
                    <option value="low">🪫 پایین (کارهای روتین)</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer bg-green-50/50 hover:bg-green-50 p-3 rounded-xl border border-green-200 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isFrog}
                      onChange={(e) => setIsFrog(e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-green-800">قورباغه امروز؟ 🐸</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">پیشنیاز (کدام کار اول باید انجام شود؟)</label>
                <select 
                  value={dependsOn}
                  onChange={(e) => setDependsOn(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                >
                  <option value="">بدون پیشنیاز</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>🔒 باید اول "{t.title}" تمام شود</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex gap-3 mt-4 border-t border-gray-100">
            <button 
              type="submit" 
              // اگر در حال ساخت کتگوری هستیم دکمه اصلی غیرفعال شود تا کانفلیکت پیش نیاید
              disabled={loading || !title.trim() || isSavingCategory}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ثبت...' : activeTab === 'goal' ? 'ذخیره هدف' : 'ثبت نهایی تسک'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              بستن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
