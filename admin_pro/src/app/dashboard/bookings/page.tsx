"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Button, Input } from "@/components/ui";
import { formatIQD, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Phone, Mail, MessageCircle, Send, Calendar, Clock, MapPin, User, Search, RefreshCw, X } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*, profiles:patient_id(email, full_name, phone), services:service_id(name_ar), branches:branch_id(name_ar)")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (bid: string) => {
    const { data } = await supabase.from("booking_messages").select("*").eq("booking_id", bid).order("created_at", { ascending: true });
    setMessages(data || []);
  }, []);

  useEffect(() => {
    fetchBookings();
    const ch = supabase.channel("admin-bookings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchBookings())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_messages" }, (p: any) => {
        if (selected && p.new.booking_id === selected.id) loadMessages(selected.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBookings, loadMessages, selected]);

  useEffect(() => { if (selected) { loadMessages(selected.id); } }, [selected, loadMessages]);

  const approve = async (b: any) => {
    try {
      let q = supabase.from("appointments").select("id")
        .eq("branch_id", b.branch_id).eq("appointment_date", b.appointment_date)
        .eq("appointment_time", b.appointment_time).in("status", ["pending", "confirmed"]).neq("id", b.id);
      if (b.doctor_name) q = q.eq("doctor_name", b.doctor_name);
      const { data: conflict } = await q;
      if (conflict && conflict.length > 0) { showToast("❌ لا يمكن الموافقة: الموعد محجوز بالفعل"); return; }
      await supabase.from("appointments").update({ status: "confirmed" }).eq("id", b.id);
      await supabase.from("notifications").insert({
        user_id: b.patient_id, title: "تم الموافقة على حجزك ✓",
        body: "تم تأكيد حجزك لـ " + (b.services?.name_ar || "") + " بتاريخ " + b.appointment_date + " الساعة " + b.appointment_time,
        type: "approved", booking_id: b.id,
      });
      showToast("✅ تمت الموافقة — وصل إشعار فوري للزبون");
      await fetchBookings(); setSelected(null);
    } catch (e: any) { showToast("❌ فشل: " + e.message); }
  };

  const reject = async (b: any) => {
    const reason = window.prompt("سبب الرفض / طلب تغيير الموعد:", "الموعد محجوز، الرجاء اختيار وقت آخر");
    if (!reason) return;
    await supabase.from("appointments").update({ status: "cancelled", admin_notes: reason }).eq("id", b.id);
    await supabase.from("notifications").insert({
      user_id: b.patient_id, title: "طلب تغيير موعد الحجز", body: reason, type: "rejected", booking_id: b.id,
    });
    showToast("🔁 تم الرفض — وصل إشعار للزبون");
    await fetchBookings(); setSelected(null);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    await supabase.from("booking_messages").insert({ booking_id: selected.id, sender_type: "admin", sender_name: "الإدارة", message: newMsg.trim() });
    await supabase.from("notifications").insert({ user_id: selected.patient_id, title: "رسالة جديدة من الإدارة", body: newMsg.trim(), type: "admin_message", booking_id: selected.id });
    setNewMsg(""); await loadMessages(selected.id); showToast("💬 تم إرسال الرسالة");
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = !search || (b.profiles?.full_name || b.profiles?.email || "").toLowerCase().includes(search.toLowerCase()) || (b.user_phone || "").includes(search);
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  const statusChip = (s: string) => {
    const map: any = { pending: ["قيد الانتظار", "gold"], confirmed: ["مؤكد ✓", "green"], completed: ["مكتمل", "blue"], cancelled: ["ملغى", "red"] };
    const [t, c] = map[s] || [s, "gray"];
    return <Badge color={c}>{t}</Badge>;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>
          {toast}
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B76E79]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف..." className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["all", "الكل"], ["pending", "قيد الانتظار"], ["confirmed", "مؤكد"], ["completed", "مكتمل"], ["cancelled", "ملغى"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={"px-4 py-2 rounded-xl font-bold text-sm transition-all " + (filter === k ? "text-white" : "bg-white text-gray-600 border border-gray-200")} style={filter === k ? { background: "linear-gradient(135deg, #D4AF37, #B76E79)" } : {}}>{l}</button>
          ))}
          <button onClick={fetchBookings} className="p-2.5 bg-white rounded-xl border border-gray-200"><RefreshCw className="w-5 h-5 text-[#D4AF37]" /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl shimmer bg-gray-200/50" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><div className="text-center py-16 text-gray-400">لا توجد حجوزات</div></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="!p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-extrabold text-lg text-gray-800">{b.profiles?.full_name || b.profiles?.email?.split("@")[0]}</span>
                      {statusChip(b.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-[#D4AF37]" /><span className="font-semibold">{b.services?.name_ar}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-[#D4AF37]" /><span>{b.branches?.name_ar}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-[#D4AF37]" /><span>{formatDate(b.appointment_date)}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-[#D4AF37]" /><span>{b.appointment_time}</span></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><Phone className="w-4 h-4 text-[#D4AF37]" /><span className="font-bold">{b.user_phone || b.profiles?.phone || "—"}</span></span>
                      <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg font-bold text-[#B76E79]">{formatIQD(b.total_price_iqd)}</span>
                      {b.user_notes && <span className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">📝 ملاحظة</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" onClick={() => setSelected(b)}><MessageCircle className="w-4 h-4 inline ml-1" />التفاصيل</Button>
                    {b.status === "pending" && (
                      <>
                        <Button onClick={() => approve(b)}><CheckCircle className="w-4 h-4 inline ml-1" />موافقة</Button>
                        <Button variant="danger" onClick={() => reject(b)}><XCircle className="w-4 h-4 inline ml-1" />رفض</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-[#241F1C] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 flex items-center justify-between text-white" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>
                <div>
                  <h2 className="text-xl font-extrabold">{selected.profiles?.full_name || "زبون"}</h2>
                  <p className="text-sm opacity-90">{selected.services?.name_ar} • {formatDate(selected.appointment_date)} • {selected.appointment_time}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الهاتف</div><div className="font-bold">{selected.user_phone || selected.profiles?.phone || "—"}</div></div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الإيميل</div><div className="font-bold truncate">{selected.profiles?.email}</div></div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">الفرع</div><div className="font-bold">{selected.branches?.name_ar}</div></div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl"><div className="text-gray-500 text-xs mb-1">السعر</div><div className="font-bold">{formatIQD(selected.total_price_iqd)}</div></div>
                </div>
                {selected.user_notes && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">📝 ملاحظة من الزبون</div>
                    <p className="text-sm text-gray-800">{selected.user_notes}</p>
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">المحادثة مع الزبون</div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 max-h-52 overflow-y-auto space-y-2">
                    {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لا توجد رسائل</p>}
                    {messages.map((m) => (
                      <div key={m.id} className={"flex " + (m.sender_type === "admin" ? "justify-end" : "justify-start")}>
                        <div className={"max-w-[75%] p-3 rounded-2xl " + (m.sender_type === "admin" ? "text-white" : "bg-white border")}>
                          <div className="text-xs opacity-80 mb-1">{m.sender_name}</div>
                          <div className="text-sm">{m.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="اكتب رسالة للزبون..." className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-[#D4AF37] focus:outline-none" />
                    <Button onClick={sendMessage}><Send className="w-5 h-5" /></Button>
                  </div>
                </div>
                {selected.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button onClick={() => approve(selected)} className="flex-1"><CheckCircle className="w-5 h-5 inline ml-1" />موافقة + إشعار فوري</Button>
                    <Button variant="danger" onClick={() => reject(selected)} className="flex-1"><XCircle className="w-5 h-5 inline ml-1" />رفض</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
