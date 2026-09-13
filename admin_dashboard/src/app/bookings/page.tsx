"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, CheckCircle, XCircle, Clock, Trash2, Search, Users, DollarSign, Filter } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await supabase.from("appointments").select("*, profiles:patient_id(email, full_name), services:service_id(name_ar, price_iqd), branches:branch_id(name_ar)").order("created_at", { ascending: false });
      setBookings(data || []);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from("appointments").update({ status }).eq("id", id);
      fetchBookings();
    } catch (error) { console.error(error); }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("حذف هذا الحجز؟")) return;
    try {
      await supabase.from("appointments").delete().eq("id", id);
      fetchBookings();
    } catch (error) { console.error(error); }
  };

  const getStatusColor = (status: string) => {
    const colors: any = { pending: "bg-yellow-100 text-yellow-700 border-yellow-200", confirmed: "bg-green-100 text-green-700 border-green-200", completed: "bg-blue-100 text-blue-700 border-blue-200", cancelled: "bg-red-100 text-red-700 border-red-200" };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status: string) => {
    const texts: any = { pending: "قيد الانتظار", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغى" };
    return texts[status] || status;
  };

  const filtered = bookings.filter(b => {
    const matchSearch = b.profiles?.email?.includes(searchTerm) || b.services?.name_ar?.includes(searchTerm) || b.doctor_name?.includes(searchTerm);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: filtered.length,
    pending: filtered.filter(b => b.status === "pending").length,
    confirmed: filtered.filter(b => b.status === "confirmed").length,
    revenue: filtered.filter(b => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + (b.total_price_iqd || 0), 0),
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-avon-gold to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الحجوزات</h1><p className="text-gray-600">عرض وإدارة جميع الحجوزات</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي الحجوزات" value={stats.total} icon={Calendar} gradient="from-blue-500 to-blue-600" />
        <StatCard title="قيد الانتظار" value={stats.pending} icon={Clock} gradient="from-yellow-500 to-yellow-600" />
        <StatCard title="مؤكد" value={stats.confirmed} icon={CheckCircle} gradient="from-green-500 to-green-600" />
        <StatCard title="الإيرادات" value={`${stats.revenue.toLocaleString()} د.ع`} icon={DollarSign} gradient="from-avon-gold to-pink-500" />
      </div>

      <div className="luxury-card bg-white p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50">
            <option value="all">جميع الحالات</option><option value="pending">قيد الانتظار</option><option value="confirmed">مؤكد</option><option value="completed">مكتمل</option><option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>

      <div className="luxury-card bg-white p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-right py-4 px-4 font-bold text-gray-700">العميل</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الخدمة</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الطبيب</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">التاريخ</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الوقت</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الحالة</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">المبلغ</th>
                <th className="text-right py-4 px-4 font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-500">لا توجد حجوزات</td></tr> : filtered.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-avon-gold to-pink-500 rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div><span className="font-semibold text-gray-900">{booking.profiles?.full_name || booking.profiles?.email?.split("@")[0] || "ضيف"}</span></div></td>
                  <td className="py-4 px-4 text-gray-700">{booking.services?.name_ar || "غير محدد"}</td>
                  <td className="py-4 px-4 text-gray-700">{booking.doctor_name || "غير محدد"}</td>
                  <td className="py-4 px-4 text-gray-600">{new Date(booking.appointment_date).toLocaleDateString("ar-IQ")}</td>
                  <td className="py-4 px-4 text-gray-600">{booking.appointment_time}</td>
                  <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>{getStatusText(booking.status)}</span></td>
                  <td className="py-4 px-4 font-bold text-avon-gold">{booking.total_price_iqd?.toLocaleString() || 0} د.ع</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {booking.status === "pending" && <button onClick={() => updateStatus(booking.id, "confirmed")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"><CheckCircle className="w-5 h-5" /></button>}
                      {booking.status !== "cancelled" && booking.status !== "completed" && <button onClick={() => updateStatus(booking.id, "cancelled")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><XCircle className="w-5 h-5" /></button>}
                      <button onClick={() => deleteBooking(booking.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
