"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("card-luxury p-6", className)}
    >
      {children}
    </motion.div>
  );
}

export function Badge({ children, color = "gold" }: { children: ReactNode; color?: "gold" | "green" | "red" | "blue" | "gray" }) {
  const colors = {
    gold: "bg-[#D4AF37]/15 text-[#B8860B] border-[#D4AF37]/30",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", colors[color])}>{children}</span>;
}

export function Button({ children, onClick, variant = "primary", className, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; className?: string; disabled?: boolean; type?: "button" | "submit" }) {
  const variants = {
    primary: "btn-luxury",
    secondary: "bg-white border-2 border-[#E8B4B8] text-[#B76E79] hover:bg-[#F8F4F0]",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
    ghost: "bg-transparent text-[#B76E79] hover:bg-[#B76E79]/10",
  };
  return (
    <motion.button whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.98 }} type={type} onClick={onClick} disabled={disabled}
      className={cn("px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], className)}>
      {children}
    </motion.button>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, icon: Icon }: { label?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: any }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-bold text-gray-600">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B76E79]" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={cn("w-full py-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition-all bg-white/70", Icon ? "pr-11 pl-4" : "px-4")} />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl shimmer bg-gray-200/50", className)} />;
}
