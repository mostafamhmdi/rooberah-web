import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google"; // ایمپورت فونت فارسی
import "./globals.css";

// تنظیم فونت وزیر
const vazir = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "روبه‌راه | دستیار زندگی من",
  description: "اپلیکیشن مدیریت عادت‌ها و هزینه‌های شخصی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // نکته مهم: افزودن dir="rtl" و کلاس فونت
    <html lang="fa" dir="rtl">
      <body className={vazir.className}>{children}</body>
    </html>
  );
}