// "use client";

// import React, { useState, useEffect } from 'react';
// import { X, Clock, Calendar, Tag, Play, Square, Plus, Check } from "lucide-react";

// interface AddDoingsProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// // رنگ‌های پیش‌فرض برای دسته‌بندی‌های جدید
// const colorOptions = [
//   { value: 'red', bgClass: 'bg-red-500', label: 'قرمز' },
//   { value: 'orange', bgClass: 'bg-orange-500', label: 'نارنجی' },
//   { value: 'amber', bgClass: 'bg-amber-500', label: 'کهربایی' },
//   { value: 'yellow', bgClass: 'bg-yellow-500', label: 'زرد' },
//   { value: 'lime', bgClass: 'bg-lime-500', label: 'لیمویی' },
//   { value: 'green', bgClass: 'bg-green-500', label: 'سبز' },
//   { value: 'emerald', bgClass: 'bg-emerald-500', label: 'زمردی' },
//   { value: 'teal', bgClass: 'bg-teal-500', label: 'کله‌غازی' },
//   { value: 'cyan', bgClass: 'bg-cyan-500', label: 'فیروزه‌ای' },
//   { value: 'blue', bgClass: 'bg-blue-500', label: 'آبی' },
//   { value: 'indigo', bgClass: 'bg-indigo-500', label: 'نیلی' },
//   { value: 'purple', bgClass: 'bg-purple-500', label: 'بنفش' },
//   { value: 'pink', bgClass: 'bg-pink-500', label: 'صورتی' },
//   { value: 'rose', bgClass: 'bg-rose-500', label: 'رز' },
//   { value: 'gray', bgClass: 'bg-gray-500', label: 'خاکستری' },
// ];

// export default function AddDoings({ isOpen, onClose, onSuccess }: AddDoingsProps) {
//   // === استیت‌های فرم اصلی ===
//   const [title, setTitle] = useState('');
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [startTime, setStartTime] = useState('08:00');
//   const [endTime, setEndTime] = useState('09:00');
//   const [duration, setDuration] = useState(60);
//   const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  
//   const [categories, setCategories] = useState<{id: number, title: string, color: string}[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // === استیت‌های مربوط به افزودن دسته‌بندی جدید ===
//   const [isAddingCategory, setIsAddingCategory] = useState(false);
//   const [newCatTitle, setNewCatTitle] = useState('');
//   const [newCatColor, setNewCatColor] = useState('blue');
//   const [isSavingCategory, setIsSavingCategory] = useState(false);

//   const API_BASE = 'http://127.0.0.1:8000/api';

//   useEffect(() => {
//     if (isOpen) {
//       fetchCategories();
//     }
//   }, [isOpen]);

//   // محاسبه خودکار اختلاف زمان
//   useEffect(() => {
//     if (startTime && endTime) {
//       const [startH, startM] = startTime.split(':').map(Number);
//       const [endH, endM] = endTime.split(':').map(Number);
      
//       let startTotal = (startH * 60) + startM;
//       let endTotal = (endH * 60) + endM;
      
//       // اگر از نیمه‌شب گذشت
//       if (endTotal < startTotal) {
//         endTotal += 24 * 60;
//       }
      
//       setDuration(endTotal - startTotal);
//     }
//   }, [startTime, endTime]);

//   const fetchCategories = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/doing-categories/`);
//       if (res.ok) {
//         const data = await res.json();
//         setCategories(data);
//       }
//     } catch (error) {
//       console.error("خطا در دریافت دسته‌بندی‌ها", error);
//     }
//   };

//   // تابع ذخیره دسته‌بندی جدید
//   const handleSaveNewCategory = async () => {
//     if (!newCatTitle.trim()) return;
    
//     setIsSavingCategory(true);
//     try {
//       const res = await fetch(`${API_BASE}/doing-categories/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           title: newCatTitle,
//           color: newCatColor
//         }),
//       });

//       if (res.ok) {
//         const newCat = await res.json();
//         setCategories([...categories, newCat]); // اضافه کردن به لیست
//         setSelectedCategoryId(newCat.id); // انتخاب خودکار دسته‌بندی جدید
        
//         // ریست کردن فرم دسته‌بندی
//         setNewCatTitle('');
//         setNewCatColor('blue');
//         setIsAddingCategory(false);
//       }
//     } catch (error) {
//       console.error("خطا در ثبت دسته‌بندی", error);
//     } finally {
//       setIsSavingCategory(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title || !startTime || !endTime) return;
    
//     setIsSubmitting(true);
//     try {
//       const payload = {
//         title,
//         date,
//         start_time: startTime,
//         end_time: endTime,
//         duration_minutes: duration,
//         category: selectedCategoryId === '' ? null : selectedCategoryId
//       };

//       const res = await fetch(`${API_BASE}/time-logs/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         // ریست کردن فرم اصلی
//         setTitle('');
//         setStartTime('08:00');
//         setEndTime('09:00');
//         setSelectedCategoryId('');
//         onSuccess();
//         onClose();
//       }
//     } catch (error) {
//       console.error("خطا در ثبت فعالیت", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
//       <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
//         <div className="flex justify-between items-center p-4 border-b border-gray-100">
//           <h2 className="text-xl font-bold text-gray-800">ثبت فعالیت جدید</h2>
//           <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
//           {/* Title */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-1">عنوان فعالیت</label>
//             <input 
//               type="text"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               placeholder="مثلا: مطالعه کتاب، برنامه‌نویسی..."
//               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             {/* Start Time */}
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
//                 <Play size={14} className="text-green-500" /> از ساعت
//               </label>
//               <input 
//                 type="time"
//                 value={startTime}
//                 onChange={(e) => setStartTime(e.target.value)}
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                 required
//               />
//             </div>

//             {/* End Time */}
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
//                 <Square size={14} className="text-red-500" /> تا ساعت
//               </label>
//               <input 
//                 type="time"
//                 value={endTime}
//                 onChange={(e) => setEndTime(e.target.value)}
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//                 required
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//              {/* Duration (Auto Calculated) */}
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
//                 <Clock size={14} className="text-blue-500" /> مدت زمان
//               </label>
//               <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 font-medium" dir="ltr">
//                 {duration} دقیقه
//               </div>
//             </div>

//             {/* Date */}
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
//                 <Calendar size={14} className="text-blue-500" /> تاریخ
//               </label>
//               <input 
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
//                 required
//               />
//             </div>
//           </div>

//           {/* ====== بخش مدیریت دسته‌بندی ====== */}
//           <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
//             {isAddingCategory ? (
//               <div className="space-y-3 animate-fade-in">
//                 <div className="flex justify-between items-center mb-1">
//                   <label className="block text-sm font-semibold text-blue-700">افزودن دسته‌بندی جدید</label>
//                   <button 
//                     type="button" 
//                     onClick={() => setIsAddingCategory(false)}
//                     className="text-gray-400 hover:text-red-500"
//                   >
//                     <X size={18} />
//                   </button>
//                 </div>
                
//                 <input 
//                   type="text" 
//                   value={newCatTitle}
//                   onChange={(e) => setNewCatTitle(e.target.value)}
//                   placeholder="نام دسته‌بندی (مثلا: کاری، یادگیری...)"
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
//                   autoFocus
//                 />
                
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs text-gray-600">رنگ:</span>
//                   <div className="flex gap-2">
//                     {colorOptions.map(color => (
//                       <button
//                         key={color.value}
//                         type="button"
//                         onClick={() => setNewCatColor(color.value)}
//                         className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color.bgClass} ${newCatColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
//                         title={color.label}
//                       >
//                         {newCatColor === color.value && <Check size={14} className="text-white" />}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={handleSaveNewCategory}
//                   disabled={!newCatTitle.trim() || isSavingCategory}
//                   className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
//                 >
//                   {isSavingCategory ? 'در حال ذخیره...' : 'ذخیره دسته‌بندی'}
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
//                   <Tag size={14} className="text-gray-500" /> دسته‌بندی (اختیاری)
//                 </label>
//                 <div className="flex gap-2">
//                   <select 
//                     value={selectedCategoryId}
//                     onChange={(e) => setSelectedCategoryId(Number(e.target.value) || '')}
//                     className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
//                   >
//                     <option value="">بدون دسته‌بندی</option>
//                     {categories.map(cat => (
//                       <option key={cat.id} value={cat.id}>
//                          {cat.title}
//                       </option>
//                     ))}
//                   </select>
//                   <button 
//                     type="button" 
//                     onClick={() => setIsAddingCategory(true)}
//                     className="p-3 bg-white border border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-xl text-gray-600 transition-all flex items-center justify-center"
//                     title="افزودن دسته‌بندی جدید"
//                   >
//                     <Plus size={20} />
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>

//           {/* Submit Button */}
//           <button 
//             type="submit"
//             disabled={isSubmitting}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2"
//           >
//             {isSubmitting ? 'در حال ثبت...' : 'ثبت فعالیت'}
//           </button>
//         </form>

//       </div>
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Tag, Play, Square, Plus, Check } from "lucide-react";

interface AddDoingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// رنگ‌های پیش‌فرض برای دسته‌بندی‌های جدید
const colorOptions = [
  { value: 'red', bgClass: 'bg-red-500', label: 'قرمز' },
  { value: 'orange', bgClass: 'bg-orange-500', label: 'نارنجی' },
  { value: 'amber', bgClass: 'bg-amber-500', label: 'کهربایی' },
  { value: 'yellow', bgClass: 'bg-yellow-500', label: 'زرد' },
  { value: 'lime', bgClass: 'bg-lime-500', label: 'لیمویی' },
  { value: 'green', bgClass: 'bg-green-500', label: 'سبز' },
  { value: 'emerald', bgClass: 'bg-emerald-500', label: 'زمردی' },
  { value: 'teal', bgClass: 'bg-teal-500', label: 'کله‌غازی' },
  { value: 'cyan', bgClass: 'bg-cyan-500', label: 'فیروزه‌ای' },
  { value: 'blue', bgClass: 'bg-blue-500', label: 'آبی' },
  { value: 'indigo', bgClass: 'bg-indigo-500', label: 'نیلی' },
  { value: 'purple', bgClass: 'bg-purple-500', label: 'بنفش' },
  { value: 'pink', bgClass: 'bg-pink-500', label: 'صورتی' },
  { value: 'rose', bgClass: 'bg-rose-500', label: 'رز' },
  { value: 'gray', bgClass: 'bg-gray-500', label: 'خاکستری' },
];

export default function AddDoings({ isOpen, onClose, onSuccess }: AddDoingsProps) {
  // === استیت‌های فرم اصلی ===
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  
  const [categories, setCategories] = useState<{id: number, title: string, color: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === استیت‌های مربوط به افزودن دسته‌بندی جدید ===
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const API_BASE = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // محاسبه خودکار اختلاف زمان
  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      let startTotal = (startH * 60) + startM;
      let endTotal = (endH * 60) + endM;
      
      // اگر از نیمه‌شب گذشت
      if (endTotal < startTotal) {
        endTotal += 24 * 60;
      }
      
      setDuration(endTotal - startTotal);
    }
  }, [startTime, endTime]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/doing-categories/`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("خطا در دریافت دسته‌بندی‌ها", error);
    }
  };

  // تابع ذخیره دسته‌بندی جدید
  const handleSaveNewCategory = async () => {
    if (!newCatTitle.trim()) return;
    
    setIsSavingCategory(true);
    try {
      const res = await fetch(`${API_BASE}/doing-categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCatTitle,
          color: newCatColor
        }),
      });

      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]); // اضافه کردن به لیست
        setSelectedCategoryId(newCat.id); // انتخاب خودکار دسته‌بندی جدید
        
        // ریست کردن فرم دسته‌بندی
        setNewCatTitle('');
        setNewCatColor('blue');
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error("خطا در ثبت دسته‌بندی", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        category: selectedCategoryId === '' ? null : selectedCategoryId
      };

      const res = await fetch(`${API_BASE}/time-logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // ریست کردن فرم اصلی
        setTitle('');
        setStartTime('08:00');
        setEndTime('09:00');
        setSelectedCategoryId('');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("خطا در ثبت فعالیت", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">ثبت فعالیت جدید</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">عنوان فعالیت</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلا: مطالعه کتاب، برنامه‌نویسی..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Play size={14} className="text-green-500" /> از ساعت
              </label>
              <input 
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Square size={14} className="text-red-500" /> تا ساعت
              </label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Duration (Auto Calculated) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock size={14} className="text-blue-500" /> مدت زمان
              </label>
              <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 font-medium" dir="ltr">
                {duration} دقیقه
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={14} className="text-blue-500" /> تاریخ
              </label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* ====== بخش مدیریت دسته‌بندی ====== */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            {isAddingCategory ? (
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
                  placeholder="نام دسته‌بندی (مثلا: کاری، یادگیری...)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  autoFocus
                />
                
                {/* تغییر در این بخش انجام شده است */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-600">رنگ:</span>
                  <div className="flex flex-wrap gap-2">
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
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Tag size={14} className="text-gray-500" /> دسته‌بندی (اختیاری)
                </label>
                <div className="flex gap-2">
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value) || '')}
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

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2"
          >
            {isSubmitting ? 'در حال ثبت...' : 'ثبت فعالیت'}
          </button>
        </form>

      </div>
    </div>
  );
}
