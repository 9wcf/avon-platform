"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Skeleton } from "@/components/ui";
import { CountUp } from "@/components/ui/CountUp";
import { formatIQD } from "@/lib/utils";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { Calendar, DollarSign, Users, Sparkles, TrendingUp, Clock } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    load();
    const ch = supabase.channel("dash-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function load() {
    const today = new Date().toISOString().split("T")[0];
    const [{ count: total }, { count: pending }, { count: todayCount }, { data: revenue }, { data: recentData }, { count: customers }] = await Promise.all([
      supabase.from("appointments").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
      supabase.from("appointments").select("total_price_iqd").eq("status", "confirmed"),
      supabase.from("appointments").select("*, services:service_id(name_ar), branches:branch_id(name_ar), profiles:patient_id(email)").order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const totalRevenue = (revenue || []).reduce((s: number, r: any) => s + Number(r.total_price_iqd || 0), 0);
    setStats({ total: total || 0, pending: pending || 0, today: todayCount || 0, revenue: totalRevenue, customers: customers || 0 });
    setRecent(recentData || []);

    // بيانات الرسم البياني (آخر 7 أيام)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const { data } = await supabase.from("appointments").select("total_price_iqd").eq("appointment_date", ds).eq("status", "confirmed");
      const sum = (data || []).reduce((s: number, r: any) => s + Number(r.total_price_iqd || 0), 0);
      days.push({ name: d.toLocaleDateString("ar-IQ", { weekday: "short" }), الإيرادات: sum, الحجوزات: (data || []).length });
    }
    setChartData(days);
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const cards = [
    { label: "إجمالي الحجوزات", value: stats.total, icon: Calendar, color: "#D4AF37", suffix: "" },
    { label: "بانتظار الموافقة", value: stats.pending, icon: Clock, color: "#F9A825", suffix: "" },
    { label: "حجوزات اليوم", value: stats.today, icon: TrendingUp, color: "#2E7D32", suffix: "" },
    { label: "الإيرادات المؤكدة", value: stats.revenue, icon: DollarSign, color: "#B76E79", prefix: "", suffix: " د.ع" },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} delay={i * 0.1}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-bold mb-2">{c.label}</p>
                  <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                    <CountUp value={c.value} suffix={c.suffix} />
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${c.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: c.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* الرسم البياني */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" delay={0.4}>
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-[#D4AF37]" /> الإيرادات آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8B4B8" strokeOpacity={0.3} />
              <XAxis dataKey="name" stroke="#999" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8B4B8", fontFamily: "Tajawal" }} formatter={(v: number) => formatIQD(v)} />
              <Area type="monotone" dataKey="الإيرادات" stroke="#D4AF37" strokeWidth={3} fill="url(#gold)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.5}>
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#B76E79]" /> إحصائيات سريعة</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#D4AF37]/10">
              <span className="font-bold text-gray-600">عدد العملاء</span>
              <span className="font-extrabold text-[#D4AF37] text-xl"><CountUp value={stats.customers} /></span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#B76E79]/10">
              <span className="font-bold text-gray-600">متوسط الحجز</span>
              <span className="font-extrabold text-[#B76E79] text-xl">{formatIQD(stats.total ? Math.round(stats.revenue / Math.max(stats.total, 1)) : 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50">
              <span className="font-bold text-gray-600">معدل الإنجاز</span>
              <span className="font-extrabold text-green-600 text-xl"><CountUp value={stats.total ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0} suffix="%" /></span>
            </div>
          </div>
        </Card>
      </div>

      {/* أحدث الحجوزات */}
      <Card delay={0.6}>
        <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#D4AF37]" /> أحدث الحجوزات</h3>
        <div className="space-y-3">
          {recent.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد حجوزات بعد</p>}
          {recent.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F8F4F0] dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#E8B4B8]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 dark:text-gray-200">{r.services?.name_ar || "خدمة"}</p>
                  <p className="text-xs text-gray-500">{r.profiles?.email?.split("@")[0]} • {r.branches?.name_ar}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#B76E79]">{formatIQD(r.total_price_iqd)}</span>
                <Badge color={r.status === "confirmed" ? "green" : r.status === "pending" ? "gold" : "gray"}>
                  {r.status === "confirmed" ? "مؤكد" : r.status === "pending" ? "قيد الانتظار" : r.status === "completed" ? "مكتمل" : "ملغى"}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
