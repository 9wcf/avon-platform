"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Bell, RefreshCw, Phone, MessageCircle, X, Send, Calendar, Clock, MapPin, User, DollarSign, Notes } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*, profiles:patient_id(email, full_name, phone), services:service_id(name_ar, price_iqd), branches:branch_id(name_ar)")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (bid: string) => {
    const { data } = await supabase
      .from("booking_messages")
      .select("*")
      .eq("booking_id", bid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, []);

  useEffect(() => {
    fetchBookings();
    const ch = supabase
      .channel("admin-bookings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchBookings())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_messages" }, (p: any) => {
        if (selected && p.new.booking_id === selected.id) loadMessages(selected.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBookings, loadMessages, selected]);

  useEffect(() => {
    if (selected) {
      loadMessages(selected.id);
      setAdminNote(selected.admin_notes || "");
    }
  }, [selected, loadMessages]);

  const approve = async (b: any) => {
    try {
      let q = supabase.from("appointments").select("id")
        .eq("branch_id", b.branch_id)
        .eq("appointment_date", b.appointment_date)
        .eq("appointment_time", b.appointment_time)
        .in("status", ["pending", "confirmed"])
        .neq("id", b.id);
      if (b.doctor_name) q = q.eq("doctor_name", b.doctor_name);
      const { data: conflict } = await q;
      if (conflict && conflict.length > 0) {
        alert("لا يمكن الموافقة: هذا الموعد محجوز بالفعل!");
        return;
      }
      const note = adminNote.trim() !== (b.admin_notes || "") ? adminNote : b.admin_notes;
      const { error } = await supabase.from("appointments")
        .update({ status: "confirmed", admin_notes: note || b.admin_notes })
        .eq("id", b.id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: b.patient_id,
        title: "تم الموافقة على حجزك ✓",
        body: "تم تأكيد حجزك لـ " + (b.services?.name_ar || "") + " بتاريخ " + b.appointment_date + " الساعة " + b.appointment_time + (note ? ". ملاحظة: " + note : ""),
        type: "approved",
        booking_id: b.id,
      });
      setToast("تمت الموافقة بنجاح! الإشعار وصل للمستخدم");
      setTimeout(() => setToast(null), 4000);
      await fetchBookings();
      setSelected(null);
    } catch (e: any) {
      alert("فشل: " + e.message);
    }
  };

  const reject = async (b: any) => {
    const reason = window.prompt("سبب الرفض / طلب تغيير الموعد:", "الموعد محجوز، الرجاء اختيار وقت آخر");
    if (!reason) return;
    await supabase.from("appointments").update({ status: "cancelled", admin_notes: reason }).eq("id", b.id);
    await supabase.from("notifications").insert({
      user_id: b.patient_id,
      title: "طلب تغيير موعد الحجز",
      body: reason,
      type: "rejected",
      booking_id: b.id,
    });
    await fetchBookings();
    setSelected(null);
  };

  const saveNote = async () => {
    if (!selected) return;
    await supabase.from("appointments").update({ admin_notes: adminNote }).eq("id", selected.id);
    setToast("تم حفظ الملاحظة");
    setTimeout(() => setToast(null), 2000);
    await fetchBookings();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected || sending) return;
    setSending(true);
    await supabase.from("booking_messages").insert({
      booking_id: selected.id,
      sender_type: "admin",
      sender_name: "الإدارة",
      message: newMsg.trim(),
    });
    await supabase.from("notifications").insert({
      user_id: selected.patient_id,
      title: "رسالة جديدة من الإدارة",
      body: newMsg.trim(),
      type: "admin_message",
      booking_id: selected.id,
    });
    setNewMsg("");
    await loadMessages(selected.id);
    setSending(false);
  };

  const statusChip = (s: string) => {
    const map: any = {
      pending: ["قيد الانتظار", "bg-yellow-100 text-yellow-700 border-yellow-200"],
      confirmed: ["مؤكد ✓", "bg-green-100 text-green-700 border-green-200"],
      completed: ["مكتمل", "bg-blue-100 text-blue-700 border-blue-200"],
      cancelled: ["ملغى", "bg-red-100 text-red-700 border-red-200"],
    };
    const [t, c] = map[s] || [s, "bg-gray-100 text-gray-700 border-gray-200"];
    return <span className={"px-3 py-1 rounded-full text-xs font-bold border " + c}>{t}</span>;
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6" dir="rtl">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] text-white rounded-2xl shadow-2xl">
          <Bell className="w-5 h-5 animate-pulse" />
          <span className="font-bold">{toast}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الحجوزات</h1>
          <p className="text-gray-600">
            {bookings.length} حجز • <span className="text-[#D4AF37] font-bold">{pendingCount} بانتظار الموافقة</span>
          </p>
        </div>
        <button onClick={fetchBookings} className="p-3 bg-white rounded-xl shadow hover:shadow-lg transition"><RefreshCw className="w-5 h-5 text-[#D4AF37]" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.length === 0 && <div className="text-center py-16 text-gray-500 bg-white rounded-2xl">لا توجد حجوزات</div>}
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="font-bold text-lg text-gray-900">{b.profiles?.full_name || b.profiles?.email?.split("@")[0] || "مستخدم"}</span>
                    {statusChip(b.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-[#D4AF37]" /> <span className="font-semibold">{b.services?.name_ar || "خدمة"}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-[#D4AF37]" /> <span>{b.branches?.name_ar || "فرع"}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-[#D4AF37]" /> <span>{b.appointment_date}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-[#D4AF37]" /> <span>{b.appointment_time}</span></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><Phone className="w-4 h-4 text-[#D4AF37]" /><span className="font-bold text-gray-800">{b.user_phone || b.profiles?.phone || "—"}</span></div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><DollarSign className="w-4 h-4 text-[#D4AF37]" /><span>{Number(b.total_price_iqd || 0).toLocaleString()} د.ع</span></div>
                    {b.user_notes && <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg"><Notes className="w-4 h-4" /><span>ملاحظة</span></div>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setSelected(b)} className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#b8962f] transition">
                    <MessageCircle className="w-4 h-4" /> التفاصيل
                  </button>
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => { setSelected(b); setTimeout(() => approve(b), 100); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                        <CheckCircle className="w-4 h-4" /> موافقة
                      </button>
                      <button onClick={() => reject(b)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                        <XCircle className="w-4 h-4" /> رفض
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] p-5 flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl font-bold">{selected.profiles?.full_name || "مستخدم"}</h2>
                <p className="text-sm opacity-90">{selected.services?.name_ar} • {selected.appointment_date} • {selected.appointment_time}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الهاتف</div><div className="font-bold">{selected.user_phone || selected.profiles?.phone || "—"}</div></div>
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الإيميل</div><div className="font-bold truncate">{selected.profiles?.email || "—"}</div></div>
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الفرع</div><div className="font-bold">{selected.branches?.name_ar}</div></div>
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الطبيب</div><div className="font-bold">{selected.doctor_name || "—"}</div></div>
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">السعر</div><div className="font-bold">{Number(selected.total_price_iqd || 0).toLocaleString()} د.ع</div></div>
                <div className="bg-gray-50 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الحالة</div><div className="font-bold">{statusChip(selected.status)}</div></div>
              </div>

              {selected.user_notes && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2"><Notes className="w-4 h-4" /> ملاحظة من الزبون</div>
                  <p className="text-sm text-gray-800">{selected.user_notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">ملاحظة الإدارة (تظهر للزبون)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                  placeholder="اكتب ملاحظة للزبون..."
                />
                <button onClick={saveNote} className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300">حفظ الملاحظة</button>
              </div>

              <div>
                <div className="font-bold text-sm mb-2 text-gray-700">المحادثة</div>
                <div className="bg-gray-50 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                  {messages.length === 0 && <p className="text-center text-gray-500 text-sm py-4">لا توجد رسائل</p>}
                  {messages.map((m) => (
                    <div key={m.id} className={"flex " + (m.sender_type === "admin" ? "justify-end" : "justify-start")}>
                      <div className={"max-w-[75%] p-3 rounded-2xl " + (m.sender_type === "admin" ? "bg-[#D4AF37] text-white" : "bg-white border")}>
                        <div className="text-xs opacity-80 mb-1">{m.sender_name}</div>
                        <div className="text-sm">{m.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="اكتب رسالة..."
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button onClick={sendMessage} disabled={sending} className="p-3 bg-[#D4AF37] text-white rounded-xl hover:bg-[#b8962f] disabled:opacity-50">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t">
                  <button onClick={() => approve(selected)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                    <CheckCircle className="w-5 h-5" /> موافقة + إشعار فوري
                  </button>
                  <button onClick={() => reject(selected)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                    <XCircle className="w-5 h-5" /> رفض
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}