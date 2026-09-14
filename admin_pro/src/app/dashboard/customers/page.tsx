"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { RequireRole } from "@/lib/auth";
import { motion } from "framer-motion";
import { Phone, Calendar, Ban, CheckCircle, Search, History } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setCustomers(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadHistory = async (id: string) => {
    const { data } = await supabase.from("appointments").select("*, services:service_id(name_ar), branches:branch_id(name_ar)").eq("patient_id", id).order("created_at", { ascending: false });
    setHistory(data || []);
  };
  const openCustomer = async (c: any) => { setSelected(c); await loadHistory(c.id); };

  const toggleBan = async (c: any) => {
    const newStatus = c.is_banned ? false : true;
    await supabase.from("profiles").update({ is_banned: newStatus }).eq("id", c.id);
    showToast(newStatus ? "🚫 تم حظر العميل" : "✅ تم تفعيل العميل");
    load();
  };

  const filtered = customers.filter(c => !search || (c.full_name || c.email || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search));

  return (
    <RequireRole roles={["admin"]}>
      <div className="space-y-6">
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{ background: "linear-gradient(135deg,#D4AF37,#B76E79)" }}>{toast}</motion.div>}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B76E79]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الإيميل أو الهاتف..." className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none bg-white" />
        </div>
        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl shimmer bg-gray-200/50" />)}</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="!p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg,#D4AF37,#B76E79)" }}>{(c.full_name || c.email || "?")[0].toUpperCase()}</div>
                      <div>
                        <h3 className="font-extrabold text-gray-800 dark:text-gray-100">{c.full_name || c.email?.split("@")[0]}</h3>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    {c.is_banned && <Badge color="red">محظور</Badge>}
                  </div>
                  <div className="space-y-1.5 text-sm mb-3">
                    <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-[#D4AF37]" />{c.phone || "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openCustomer(c)} className="flex-1 !py-2 !text-sm"><History className="w-4 h-4 inline ml-1" />السجل</Button>
                    <button onClick={() => toggleBan(c)} className={"px-3 py-2 rounded-xl text-sm font-bold " + (c.is_banned ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500")}>{c.is_banned ? <CheckCircle className="w-4 h-4 inline" /> : <Ban className="w-4 h-4 inline" />}</button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>}
        <Modal open={!!selected} onClose={() => setSelected(null)} title={"سجل حجوزات " + (selected?.full_name || selected?.email?.split("@")[0] || "")}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد حجوزات</p>}
            {history.map(h => (
              <div key={h.id} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-800 dark:text-gray-100">{h.services?.name_ar}</span>
                  <Badge color={h.status === "confirmed" ? "green" : h.status === "pending" ? "gold" : h.status === "completed" ? "blue" : "gray"}>{h.status === "confirmed" ? "مؤكد" : h.status === "pending" ? "انتظار" : h.status === "completed" ? "مكتمل" : "ملغى"}</Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-2"><Calendar className="w-3 h-3" />{h.appointment_date} • {h.appointment_time} • {h.branches?.name_ar}</p>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </RequireRole>
  );
}
