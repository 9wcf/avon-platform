"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, Flower2,
  MapPin, Tag, Bell, Settings, BarChart3, LogOut,
  Menu, X, Search, Sparkles, FileText,
} from "lucide-react";

const navigation = [
  { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { name: "الحجوزات", href: "/bookings", icon: Calendar },
  { name: "العملاء", href: "/customers", icon: Users },
  { name: "الأطباء", href: "/doctors", icon: Stethoscope },
  { name: "الخدمات", href: "/services", icon: Flower2 },
  { name: "الفروع", href: "/branches", icon: MapPin },
  { name: "العروض", href: "/offers", icon: Tag },
  { name: "المحتوى", href: "/content", icon: FileText },
  { name: "الإشعارات", href: "/notifications", icon: Bell },
  { name: "التقارير", href: "/reports", icon: BarChart3 },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push("/login");
    else setUser(session.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4F0] via-white to-[#F8F4F0]" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-500 ease-out z-50 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-24 px-8 border-b border-gray-100 bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] bg-clip-text text-transparent">AVON</h1>
                <p className="text-xs text-gray-500 font-medium">لوحة الإدارة</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-l from-[#D4AF37] to-[#E8B4B8] text-white shadow-xl shadow-[#D4AF37]/20 scale-105"
                      : "text-gray-700 hover:bg-gradient-to-l hover:from-gray-50 hover:to-gray-100 hover:scale-102"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-[#D4AF37]'} transition-colors`} />
                  </div>
                  <span className="font-semibold text-sm">{item.name}</span>
                  {isActive && <div className="mr-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </a>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-full blur-md opacity-50" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{user?.email?.split("@")[0] || "مدير النظام"}</p>
                <p className="text-xs text-gray-500">مدير كامل الصلاحيات</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="lg:mr-80">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between h-20 px-8 lg:px-12">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-[#E8B4B8]/10 hover:from-[#D4AF37]/20 hover:to-[#E8B4B8]/20 transition-all">
              <Menu className="w-6 h-6 text-[#D4AF37]" />
            </button>

            <div className="flex-1 max-w-xl mx-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#E8B4B8]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                  <input
                    type="text"
                    placeholder="البحث..."
                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-3 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-[#E8B4B8]/10 hover:from-[#D4AF37]/20 hover:to-[#E8B4B8]/20 transition-all group">
                <Bell className="w-6 h-6 text-gray-600 group-hover:text-[#D4AF37] transition-colors" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content - مع padding وحدود */}
        <main className="p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

