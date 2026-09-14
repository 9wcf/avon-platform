"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, Badge } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { formatIQD } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Sparkles, Power, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function ServicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name_ar: "", description_ar: "", price_iqd: "", duration_minutes: "45", image_url: "", is_active: true });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    setItems(data || []); setLoading(false);
  };

  useEffect(() => { load(); const ch = supabase.channel("svc").on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => load()).subscribe(); return () => { supabase.removeChannel(ch); }; }, []);

  const openAdd = () => { setEditing(null); setForm({ name_ar: "", description_ar: "", price_iqd: "", duration_minutes: "45", image_url: "", is_active: true }); setModalOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ name_ar: s.name_ar, description_ar: s.description_ar || "", price_iqd: s.price_iqd.toString(), duration_minutes: (s.duration_minutes || 45).toString(), image_url: s.image_url || "", is_active: s.is_active }); setModalOpen(true); };

  const save = async () => {
    if (!form.name_ar || !form.price_iqd) { showToast("❌ الاسم والسعر مطلوبين"); return; }
    const payload = { name_ar: form.name_ar, description_ar: form.description_ar, price_iqd: Number(form.price_iqd), duration_minutes: Number(form.duration_minutes), image_url: form.image_url, is_active: form.is_active };
    try {
      const res = editing
        ? await supabase.from("services").update(payload).eq("id", editing.id).select()
        : await supabase.from("services").insert(payload).select();
      if (res.error) { showToast("❌ فشل: " + res.error.message); return; }
      if (!res.data || res.data.length === 0) { showToast("❌ لم يتم حفظ البيانات"); return; }
      showToast(editing ? "✅ تم التعديل" : "✅ تمت الإضافة");
      setModalOpen(false);
      await load();
    } catch (e: any) { showToast("❌ خطأ: " + e.message); }
  };

  const del = async (id: string) => { if (!confirm("هل أنت متأكد من الحذف؟")) return; const r = await supabase.from("services").delete().eq("id", id); if (r.error) { showToast("❌ فشل الحذف: " + r.error.message); return; } showToast("🗑️ تم الحذف"); load(); };
  const toggle = async (s: any) => { await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id); load(); };

  return (
    <div className="space-y-6">
      {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>{toast}</motion.div>}
      <div className="flex items-center justify-between">
        <p className="text-gray-500">{items.length} خدمة</p>
        <Button onClick={openAdd}><Plus className="w-4 h-4 inline ml-1" />إضافة خدمة</Button>
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3].map(i=><div key={i} className="h-48 rounded-2xl shimmer bg-gray-200/50"/>)}</div> :
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.03 }}>
            <Card className="!p-0 overflow-hidden">
              <div className="h-32 relative">
                {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center" style={{background:"linear-gradient(135deg,#E8B4B8,#B76E79)"}}><Sparkles className="w-10 h-10 text-white"/></div>}
                <button onClick={()=>toggle(s)} className={"absolute top-3 left-3 p-2 rounded-full "+(s.is_active?"bg-green-500":"bg-gray-400")}><Power className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-extrabold text-gray-800 dark:text-gray-100">{s.name_ar}</h3>
                  <Badge color={s.is_active?"green":"gray"}>{s.is_active?"نشط":"معطل"}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description_ar || "لا يوجد وصف"}</p>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#B76E79]">{formatIQD(s.price_iqd)} • {s.duration_minutes}د</span>
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(s)} className="p-2 hover:bg-[#D4AF37]/10 rounded-lg"><Edit2 className="w-4 h-4 text-[#D4AF37]"/></button>
                    <button onClick={()=>del(s.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?"تعديل الخدمة":"إضافة خدمة"}>
        <div className="space-y-4">
          <Field label="اسم الخدمة" value={form.name_ar} onChange={v=>setForm({...form,name_ar:v})}/>
          <div><label className="text-sm font-bold text-gray-600 mb-1 block">الوصف</label><textarea value={form.description_ar} onChange={e=>setForm({...form,description_ar:e.target.value})} rows={3} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="السعر (د.ع)" value={form.price_iqd} onChange={v=>setForm({...form,price_iqd:v})} type="number"/>
            <Field label="المدة (دقيقة)" value={form.duration_minutes} onChange={v=>setForm({...form,duration_minutes:v})} type="number"/>
          </div>
          <ImageUpload value={form.image_url} onChange={v=>setForm({...form,image_url:v})}/>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} className="w-5 h-5 accent-[#B76E79]"/><span className="font-bold text-gray-700">نشط ومتاح للحجز</span></label>
          <Button onClick={save} className="w-full">{editing?"حفظ التعديلات":"إضافة الخدمة"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type="text", placeholder="" }: any) {
  return (<div><label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>);
}
