"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHabitModal({ isOpen, onClose, onSuccess }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/habits/', { name });
      setName('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding habit:", error);
      setErrorMsg('مشکلی در ثبت عادت پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl relative font-vazir">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-6">ساخت عادت جدید 🎯</h2>

        {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نام عادت</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلا: روزی ۳۰ صفحه کتاب خواندن"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/30 disabled:opacity-70 mt-4"
          >
            {loading ? 'در حال ثبت...' : 'شروع این عادت'}
          </button>
        </form>
      </div>
    </div>
  );
}
