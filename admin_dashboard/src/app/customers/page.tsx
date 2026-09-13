"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Phone, Calendar, Search, Ban, CheckCircle, TrendingUp } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: appointmentsData } = await supabase.from("appointments").select("patient_id, status, total_price_iqd");
      const customersWithStats = profilesData?.map(profile => {
        const profileAppointments = appointmentsData?.filter(a => a.patient_id === profile.id) || [];
        const totalSpent = profileAppointments.filter(a => a.status === "completed" || a.status === "confirmed").reduce((sum, a) => sum + (a.total_price_iqd || 0), 0);
        return { ...profile, appointmentsCount: profileAppointments.length, totalSpent, lastVisit: profileAppointments.length > 0 ? new Date(Math.max(...profileAppointments.map(a => new Date(a.created_at).getTime()))).toLocaleDateString("ar-IQ") : "لم يحجز بعد" };
      }) || [];
      setCustomers(customersWithStats);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const toggleCustomerStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", id);
      fetchCustomers();
    } catch (error) { console.error(error); }
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.email?.includes(searchTerm) || c.full_name?.includes(searchTerm) || c.phone?.includes(searchTerm);
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
    return matchSearch && matchStatus;
  });

  const stats = { total: filtered.length, active: filtered.filter(c => c.is_active).length, inactive: filtered.filter(c => !c.is_active).length, totalRevenue: filtered.reduce((sum, c) => sum + (c.totalSpent || 0), 0) };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-avon-gold to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة العملاء</h1><p className="text-gray-600">عرض وإدارة جميع العملاء</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي العملاء" value={stats.total} icon={Users} gradient="from-blue-500 to-blue-600" />
        <StatCard title="النشطون" value={stats.active} icon={CheckCircle} gradient="from-green-500 to-green-600" />
        <StatCard title="غير النشطون" value={stats.inactive} icon={Ban} gradient="from-red-500 to-red-600" />
        <StatCard title="الإيرادات" value={`${stats.totalRevenue.toLocaleString()} د.ع`} icon={TrendingUp} gradient="from-avon-gold to-pink-500" />
      </div>

      <div className="luxury-card bg-white p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50">
            <option value="all">جميع العملاء</option><option value="active">النشطون</option><option value="inactive">غير النشطون</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full text-center py-12 luxury-card bg-white"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 text-lg">لا يوجد عملاء</p></div> : filtered.map((customer) => (
          <div key={customer.id} className="luxury-card bg-white group hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${customer.is_active ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-gradient-to-br from-gray-400 to-gray-500"}`}>
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div><h3 className="font-bold text-gray-900 text-lg">{customer.full_name || "عميل جديد"}</h3><p className="text-sm text-gray-500">{customer.email}</p></div>
              </div>
              <button onClick={() => toggleCustomerStatus(customer.id, customer.is_active)} className={`p-2 rounded-lg transition-all ${customer.is_active ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"}`}>
                {customer.is_active ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
              </button>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {customer.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-avon-gold" /><span>{customer.phone}</span></div>}
              <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4 text-avon-gold" /><span>آخر زيارة: {customer.lastVisit}</span></div>
              <div className="flex items-center justify-between pt-3">
                <div className="text-center"><p className="text-2xl font-bold text-avon-gold">{customer.appointmentsCount}</p><p className="text-xs text-gray-500">حجوزات</p></div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center"><p className="text-2xl font-bold text-avon-gold">{customer.totalSpent.toLocaleString()}</p><p className="text-xs text-gray-500">د.ع إجمالي</p></div>
              </div>
            </div>
          </div>
        ))}
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
