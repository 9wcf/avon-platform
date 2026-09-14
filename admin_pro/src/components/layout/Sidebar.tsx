"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Calendar, Sparkles, Stethoscope, MapPin, Tag,
  Users, Bell, FileText, BarChart3, Settings, Shield, LogOut, ChevronLeft, Menu
} from "lucide-react";
import { useState } from "react";

const allItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { href: "/dashboard/bookings", label: "الحجوزات", icon: Calendar, roles: ["admin", "staff"] },
  { href: "/dashboard/services", label: "الخدمات", icon: Sparkles, roles: ["admin"] },
  { href: "/dashboard/doctors", label: "الأطباء", icon: Stethoscope, roles: ["admin"] },
  { href: "/dashboard/branches", label: "الفروع", icon: MapPin, roles: ["admin"] },
  { href: "/dashboard/offers", label: "العروض", icon: Tag, roles: ["admin"] },
  { href: "/dashboard/customers", label: "العملاء", icon: Users, roles: ["admin"] },
  { href: "/dashboard/notifications", label: "الإشعارات", icon: Bell, roles: ["admin", "staff"] },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText, roles: ["admin"] },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3, roles: ["admin"] },
  { href: "/dashboard/admins", label: "المستخدمين", icon: Shield, roles: ["admin"] },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, signOut, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const items = allItems.filter((i) => i.roles.includes(role || ""));

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed right-0 top-0 h-screen z-40 glass border-l border-white/30 flex flex-col"
    >
      {/* الشعار */}
      <div className="p-5 flex items-center justify-between border-b border-[#E8B4B8]/30">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-gradient-gold text-lg leading-tight">AVON</h1>
                <p className="text-[10px] text-gray-500">لوحة التحكم</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-[#B76E79]/10 transition-colors">
          <ChevronLeft className={`w-5 h-5 text-[#B76E79] transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* القائمة */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: -4 }}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active ? "text-white" : "text-gray-600 hover:bg-[#B76E79]/10"}`}
                style={active ? { background: "linear-gradient(135deg, #D4AF37, #B76E79)" } : {}}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-sm whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-xl -z-10" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }} />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* تسجيل الخروج */}
      <div className="p-3 border-t border-[#E8B4B8]/30">
        <button onClick={() => signOut()} className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </motion.aside>
  );
}
