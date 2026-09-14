"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

const titles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/bookings": "إدارة الحجوزات",
  "/dashboard/services": "إدارة الخدمات",
  "/dashboard/doctors": "إدارة الأطباء",
  "/dashboard/branches": "إدارة الفروع",
  "/dashboard/offers": "إدارة العروض",
  "/dashboard/customers": "إدارة العملاء",
  "/dashboard/notifications": "الإشعارات",
  "/dashboard/content": "إدارة المحتوى",
  "/dashboard/reports": "التقارير المالية",
  "/dashboard/admins": "إدارة المستخدمين",
  "/dashboard/settings": "الإعدادات",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--rose-soft)" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gradient-gold font-bold text-xl">جاري تحميل AVON...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--rose-soft)" }}>
      <Sidebar />
      <div className="mr-[260px] transition-all duration-300">
        <Header title={titles[pathname] || "لوحة التحكم"} />
        <main className="p-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
