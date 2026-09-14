"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button } from "@/components/ui";
import { RequireRole } from "@/lib/auth";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function ContentPage() {
  const [form, setForm] = useState<any>({ hero_title: "", hero_subtitle: "", hero_badge: "", contact_phone: "", contact_address: "", instagram: "", facebook: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("app_settings").select("*").limit(1);
    if (data && data[0]) setForm(data[0]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("app_settings").select("id").limit(1);
      if (existing && existing[0]) {
        await supabase.from("app_settings").update(form).eq("id", existing[0].id);
      } else {
        await supabase.from("app_settings").insert(form);
      }
      showToast("✅ تم حفظ المحتوى");
    } catch (e: any) { showToast("❌ " + e.message); }
    setSaving(false);
  };

  return (
    <RequireRole roles={["admin"]}>
      <div className="space-y-6 max-w-2xl">
        {toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{ background: "linear-gradient(135deg,#D4AF37,#B76E79)" }}>{toast}</motion.div>}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#D4AF37,#B76E79)" }}><FileText className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-extrabold text-gradient-gold">محتوى الواجهة</h2><p className="text-sm text-gray-500">عدّل النصوص اللي تظهر بالتطبيق</p></div>
          </div>
          <div className="space-y-4">
            <div className="font-bold text-[#B76E79] border-b pb-2">القسم الرئيسي (Hero)</div>
            <F label="العنوان الرئيسي" value={form.hero_title} onChange={v => setForm({ ...form, hero_title: v })} />
            <F label="العنوان الفرعي" value={form.hero_subtitle} onChange={v => setForm({ ...form, hero_subtitle: v })} />
            <F label="الشارة (Badge)" value={form.hero_badge} onChange={v => setForm({ ...form, hero_badge: v })} />
            <div className="font-bold text-[#B76E79] border-b pb-2 mt-6">معلومات التواصل</div>
            <F label="هاتف التواصل" value={form.contact_phone} onChange={v => setForm({ ...form, contact_phone: v })} />
            <F label="العنوان" value={form.contact_address} onChange={v => setForm({ ...form, contact_address: v })} />
            <div className="font-bold text-[#B76E79] border-b pb-2 mt-6">السوشيال ميديا</div>
            <F label="انستغرام" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />
            <F label="فيسبوك" value={form.facebook} onChange={v => setForm({ ...form, facebook: v })} />
            <Button onClick={save} disabled={saving} className="w-full">{saving ? "جاري الحفظ..." : "حفظ المحتوى"}</Button>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}

function F({ label, value, onChange }: any) {
  return (<div><label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label><input value={value || ""} onChange={e => onChange(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none" /></div>);
}
