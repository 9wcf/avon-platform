"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#D4AF37", "#E8B4B8", "#FFD4C4", "#A8D8D4", "#E6E6FA"];

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    totalClients: 0,
    totalServices: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*, services:service_id(name_ar, price_iqd), profiles:patient_id(email)")
        .order("created_at", { ascending: false });

      const { data: services } = await supabase.from("services").select("id, name_ar");
      const { count: clientsCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      const totalRevenue = appointments
        ?.filter(a => a.status === "confirmed" || a.status === "completed")
        .reduce((sum, a) => sum + (a.total_price_iqd || 0), 0) || 0;

      setStats({
        totalAppointments: appointments?.length || 0,
        totalRevenue,
        totalClients: clientsCount || 0,
        totalServices: services?.length || 0,
      });

      // Chart data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      const chartData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString("ar-IQ", { weekday: "short" }),
        appointments: appointments?.filter(a => a.created_at?.startsWith(date)).length || 0,
        revenue: appointments
          ?.filter(a => a.created_at?.startsWith(date) && (a.status === "confirmed" || a.status === "completed"))
          .reduce((sum, a) => sum + (a.total_price_iqd || 0), 0) || 0,
      }));
      setChartData(chartData);

      // Service statistics
      const serviceStats = services?.map(service => {
        const count = appointments?.filter(a => a.service_id === service.id).length || 0;
        return { name: service.name_ar, value: count };
      }) || [];
      setServiceStats(serviceStats);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="absolute inset-0 bg-avon-gold rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h1>
        <p className="text-gray-600">تحليل شامل لأداء المركز</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي الحجوزات" value={stats.totalAppointments} icon={Calendar} gradient="from-blue-500 to-blue-600" />
        <StatCard title="الإيرادات" value={`${stats.totalRevenue.toLocaleString()} د.ع`} icon={DollarSign} gradient="from-avon-gold to-avon-gold/80" />
        <StatCard title="العملاء" value={stats.totalClients} icon={Users} gradient="from-green-500 to-green-600" />
        <StatCard title="الخدمات" value={stats.totalServices} icon={Activity} gradient="from-purple-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="luxury-card bg-white p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">الحجوزات خلال آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
              <Line type="monotone" dataKey="appointments" stroke="#D4AF37" strokeWidth={3} dot={{ fill: "#D4AF37", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="luxury-card bg-white p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">الإيرادات خلال آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "12px" }} />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="luxury-card bg-white p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">توزيع الحجوزات حسب الخدمة</h3>
        {serviceStats.length === 0 ? (
          <p className="text-center text-gray-500 py-12">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={serviceStats} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={100} dataKey="value">
                {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient }: any) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
      <div className="relative luxury-card bg-white group-hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-600 mb-1">{title}</p><h4 className="text-2xl font-bold">{value}</h4></div>
          <div className={`p-3 bg-gradient-to-r ${gradient} rounded-2xl shadow-lg`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </div>
    </div>
  );
}
