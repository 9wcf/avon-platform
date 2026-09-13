"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Bell, RefreshCw } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*, profiles:patient_id(email, full_name), services:service_id(name_ar), branches:branch_id(name_ar)")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
    const ch = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, () => {
        setToast("وصل حجز جديد بانتظار الموافقة!");
        setTimeout(() => setToast(null), 5000);
        fetchBookings();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBookings]);

  const approve = async (b: any) => {
    let q = supabase.from("appointments").select("id")
      .eq("branch_id", b.branch_id)
      .eq("appointment_date", b.appointment_date)
      .eq("appointment_time", b.appointment_time)
      .in("status", ["pending", "confirmed"])
      .neq("id", b.id);
    if (b.doctor_name) q = q.eq("doctor_name", b.doctor_name); else q = q.is("doctor_name", null);
    const { data: conflict } = await q;
    if (conflict && conflict.length > 0) { alert("لا يمكن الموافقة: الموعد محجوز بالفعل!"); return; }
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", b.id);
    await supabase.from("notifications").insert({
      user_id: b.patient_id,
      title: "تم الموافقة على حجزك",
      body: "حجزك (" + (b.services?.name_ar ?? "") + ") بتاريخ " + b.appointment_date + " الساعة " + b.appointment_time + " تم تأكيده.",
      type: "approved",
      booking_id: b.id,
    });
    fetchBookings();
  };

  const reject = async (b: any) => {
    const reason = window.prompt("سبب الرفض / طلب تغيير الموعد:", "الموعد محجوز، الرجاء اختيار وقت آخر");
    if (!reason) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", b.id);
    await supabase.from("notifications").insert({
      user_id: b.patient_id,
      title: "طلب تغيير موعد الحجز",
      body: reason,
      type: "rejected",
      booking_id: b.id,
    });
    fetchBookings();
  };

  const statusChip = (s: string) => {
    const map: any = { pending: ["قيد الانتظار", "bg-yellow-100 text-yellow-700"], confirmed: ["مؤكد", "bg-green-100 text-green-700"], completed: ["مكتمل", "bg-blue-100 text-blue-700"], cancelled: ["ملغى", "bg-red-100 text-red-700"] };
    const [t, c] = map[s] || [s, "bg-gray-100 text-gray-700"];
    return <span className={"px-3 py-1 rounded-full text-xs font-bold " + c}>{t}</span>;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] text-white rounded-2xl shadow-2xl">
          <Bell className="w-5 h-5 animate-pulse" />
          <span className="font-bold">{toast}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الحجوزات</h1>
          <p className="text-gray-600">وافق أو ارفض الحجوزات الواردة</p>
        </div>
        <button onClick={fetchBookings} className="p-3 bg-white rounded-xl shadow"><RefreshCw className="w-5 h-5 text-[#D4AF37]" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
      ) : (
        <div className="space-y-4">
          {bookings.length === 0 && <div className="text-center py-16 text-gray-500">لا توجد حجوزات</div>}
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-gray-900">{b.profiles?.full_name || b.profiles?.email?.split("@")[0]}</span>
                  {statusChip(b.status)}
                </div>
                <p className="text-sm text-gray-600">
                  {b.services?.name_ar} • {b.branches?.name_ar} • {b.doctor_name || "بدون طبيب"}
                </p>
                <p className="text-sm text-gray-500">{b.appointment_date} — {b.appointment_time} • {Number(b.total_price_iqd || 0).toLocaleString()} د.ع</p>
              </div>
              {b.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => approve(b)} className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                    <CheckCircle className="w-5 h-5" /> موافقة
                  </button>
                  <button onClick={() => reject(b)} className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                    <XCircle className="w-5 h-5" /> رفض / تغيير
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}