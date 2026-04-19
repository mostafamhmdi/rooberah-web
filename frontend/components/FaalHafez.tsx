"use client";

import { useState } from 'react';
import { Sparkles, BookOpen, X, Loader2 } from 'lucide-react';

interface FaalData {
  Poem: string;
  Interpretation: string;
}

export default function FaalHafez() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faal, setFaal] = useState<FaalData | null>(null);

  const getFaal = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      // درخواست به API رایگان فال
      const response = await fetch('https://faal.awdev.ir/api/get');
      const data = await response.json();
      setFaal(data);
    } catch (error) {
      console.error("خطا در دریافت فال:", error);
      setFaal({
        Poem: "خطا در ارتباط با سرور حافظ!\nلطفاً دوباره نیت کنید و تلاش کنید.",
        Interpretation: "احتمالاً اینترنت شما قطع است یا سرور فال در دسترس نیست."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* دکمه باز کردن فال که در صفحه اصلی قرار میگیرد */}
      <button 
        onClick={getFaal}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 p-6 rounded-3xl shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden flex items-center justify-between text-right"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">فال حافظ</h3>
            <p className="text-teal-50 mt-1 text-sm font-medium">نیت کن و یک فال بگیر...</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/4"></div>
      </button>

      {/* مودال نمایش فال */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* هدر مودال */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-teal-50">
              <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                فال شما
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* بدنه مودال */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-teal-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-medium animate-pulse">خواجه در حال جستجوی دیوان است...</p>
                </div>
              ) : faal ? (
                <div className="space-y-6">
                  {/* بخش شعر */}
                  <div className="bg-amber-50 rounded-2xl p-6 text-center shadow-inner border border-amber-100">
                    <p className="whitespace-pre-wrap text-gray-800 leading-9 font-medium text-lg">
                      {faal.Poem}
                    </p>
                  </div>
                  
                  {/* بخش تفسیر */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      تفسیر فال
                    </h4>
                    <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {faal.Interpretation}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* فوتر مودال */}
            {!loading && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                <button 
                  onClick={getFaal}
                  className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                >
                  یک فال دیگر بگیر
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
