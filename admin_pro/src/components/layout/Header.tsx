"use client";
import { useAuth } from "@/lib/auth";
import { Moon, Sun, Bell } from "lucide-react";
import { useState, useEffect } from "react";

export function Header({ title }: { title: string }) {
  const { user, role } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/30 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-extrabold text-gradient-gold">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {role === "admin" ? "مدير النظام • صلاحيات كاملة" : "موظف استقبال • صلاحيات محدودة"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2.5 rounded-xl hover:bg-[#B76E79]/10 transition-colors">
          <Bell className="w-5 h-5 text-[#B76E79]" />
          <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button onClick={() => setDark(!dark)} className="p-2.5 rounded-xl hover:bg-[#B76E79]/10 transition-colors">
          {dark ? <Sun className="w-5 h-5 text-[#D4AF37]" /> : <Moon className="w-5 h-5 text-[#B76E79]" />}
        </button>
        <div className="flex items-center gap-3 pr-3 border-r border-[#E8B4B8]/30">
          <div className="text-left">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{user?.email?.split("@")[0]}</p>
            <p className="text-[10px] text-gray-500">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
