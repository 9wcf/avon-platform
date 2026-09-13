"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Users, Calendar, DollarSign, Clock, CheckCircle, Activity, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#D4AF37", "#E8B4B8", "#FFD4C4", "#A8D8D4", "#E6E6FA"];

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalAppointments: 0, pendingAppointments: 0, confirmedAppointments: 0, totalRevenue: 0, totalClients: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: appointments } = await supabase.from("appointments").select("*, profiles:patient_id(email), services:service_id(name_ar, price_iqd)").order("created_at", { ascending: false }).limit(10);
      const { count: clientsCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      const total = appointments?.length || 0;
      const pending = appointments?.filter(a => a.status === "pending").length || 0;
      const confirmed = appointments?.filter(a => a.status === "confirmed").length || 0;
      const revenue = appointments?.filter(a => a.status === "confirmed" || a.status === "completed").reduce((sum, a) => sum + (a.total_price_iqd || 0), 0) || 0;

      setStats({ totalAppointments: total, pendingAppointments: pending, confirmedAppointments: confirmed, totalRevenue: revenue, totalClients: clientsCount || 0 });
      setRecentBookings(appointments || []);

      const last7Days = Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - i); return date.toISOString().split("T")[0]; }).reverse();
      const chartData = last7Days.map(date => ({ date: new Date(date).toLocaleDateString("ar-IQ", { weekday: "short" }), appointments: appointments?.filter(a => a.created_at?.startsWith(date)).length || 0 }));
      setChartData(chartData);
    } catch (error) { console.error("Error:", error); } finally { setIsLoading(false); }
  };

  const getStatusColor = (status: string) => {
    const colors: any = { pending: "bg-yellow-100 text-yellow-700 border-yellow-200", confirmed: "bg-green-100 text-green-700 border-green-200", completed: "bg-blue-100 text-blue-700 border-blue-200", cancelled: "bg-red-100 text-red-700 border-red-200" };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status: string) => {
    const texts: any = { pending: "قيد الانتظار", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغى" };
    return texts[status] || status;
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#D4AF37] via-[#E8B4B8] to-[#D4AF37]/80 rounded-3xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-white/90" />
            <h1 className="text-3xl font-bold text-white">مرحباً بك في لوحة الإدارة</h1>
          </div>
          <p className="text-white/90 text-lg">نظام إدارة مركز AVON الاحترافي</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الحجوزات" value={stats.totalAppointments} icon={Calendar} gradient="from-blue-500 to-blue-600" trend={12} />
        <StatCard title="قيد الانتظار" value={stats.pendingAppointments} icon={Clock} gradient="from-yellow-500 to-yellow-600" trend={-5} />
        <StatCard title="مؤكد" value={stats.confirmedAppointments} icon={CheckCircle} gradient="from-green-500 to-green-600" trend={8} />
        <StatCard title="الإيرادات" value={`${stats.totalRevenue.toLocaleString()} د.ع`} icon={DollarSign} gradient="from-[#D4AF37] to-[#E8B4B8]" trend={15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="luxury-card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">إحصائيات الحجوزات</h3>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl"><Activity className="w-5 h-5 text-white" /></div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/><stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="appointments" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="luxury-card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">توزيع الحالات</h3>
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl"><TrendingUp className="w-5 h-5 text-white" /></div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={[{ name: "قيد الانتظار", value: stats.pendingAppointments }, { name: "مؤكد", value: stats.confirmedAppointments }, { name: "مكتمل", value: stats.totalAppointments - stats.pendingAppointments - stats.confirmedAppointments }]} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={100} fill="#8884d8" dataKey="value">
                {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="luxury-card bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">آخر الحجوزات</h3>
          <button className="px-4 py-2 text-sm font-semibold text-[#D4AF37] bg-[#D4AF37]/10 rounded-xl hover:bg-[#D4AF37]/20 transition-all">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-right py-4 px-4 font-bold text-gray-700">العميل</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الخدمة</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">التاريخ</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الوقت</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الحالة</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-500">لا توجد حجوزات</td></tr> : recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div><span className="font-semibold text-gray-900">{booking.profiles?.email?.split("@")[0] || "ضيف"}</span></div></td>
                  <td className="py-4 px-4 text-gray-700">{booking.services?.name_ar || "غير محدد"}</td>
                  <td className="py-4 px-4 text-gray-600">{new Date(booking.appointment_date).toLocaleDateString("ar-IQ")}</td>
                  <td className="py-4 px-4 text-gray-600">{booking.appointment_time}</td>
                  <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>{getStatusText(booking.status)}</span></td>
                  <td className="py-4 px-4 font-bold text-[#D4AF37]">{booking.total_price_iqd?.toLocaleString() || 0} د.ع</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient, trend }: any) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
      <div className="relative luxury-card bg-white group-hover:transform group-hover:scale-105 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
          </div>
          <div className={`p-3 bg-gradient-to-r ${gradient} rounded-2xl shadow-lg`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
        <div className="flex items-center gap-2">
          {trend > 0 ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
          <span className={`text-sm font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>{Math.abs(trend)}%</span>
          <span className="text-sm text-gray-500">عن الأسبوع الماضي</span>
        </div>
      </div>
    </div>
  );
}
