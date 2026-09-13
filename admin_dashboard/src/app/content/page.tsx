"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, CheckCircle, Sparkles, Phone, AtSign, Globe } from "lucide-react";

export default function ContentPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
    setForm(data || {});
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  if (!form) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>;

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  const input = "w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50 transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4F0] via-white to-[#F8F4F0] p-6 lg:p-10" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المحتوى</h1>
            <p className="text-gray-600">تحكم كامل بنصوص ومعلومات التطبيق</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl">
              <CheckCircle className="w-5 h-5" /><span className="font-semibold">تم الحفظ</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-xl"><Sparkles className="w-5 h-5 text-white" /></div>
              <h2 className="text-xl font-bold">الواجهة الرئيسية</h2>
            </div>
            <div><label className="block text-sm font-semibold mb-2">شارة العرض</label><input className={input} value={form.hero_badge || ""} onChange={set("hero_badge")} /></div>
            <div><label className="block text-sm font-semibold mb-2">العنوان الرئيسي</label><input className={input} value={form.hero_title || ""} onChange={set("hero_title")} /></div>
            <div><label className="block text-sm font-semibold mb-2">العنوان الفرعي</label><input className={input} value={form.hero_subtitle || ""} onChange={set("hero_subtitle")} /></div>
            <div><label className="block text-sm font-semibold mb-2">نص عن المركز</label><textarea className={input} rows={3} value={form.about_text || ""} onChange={set("about_text")} /></div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-xl"><Phone className="w-5 h-5 text-white" /></div>
                <h2 className="text-xl font-bold">معلومات التواصل</h2>
              </div>
              <div><label className="block text-sm font-semibold mb-2">رقم الهاتف</label><input className={input} value={form.phone || ""} onChange={set("phone")} /></div>
              <div><label className="block text-sm font-semibold mb-2">العنوان</label><input className={input} value={form.address || ""} onChange={set("address")} /></div>
              <div><label className="block text-sm font-semibold mb-2">ساعات العمل</label><input className={input} value={form.working_hours || ""} onChange={set("working_hours")} /></div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#E8B4B8] rounded-xl"><AtSign className="w-5 h-5 text-white" /></div>
                <h2 className="text-xl font-bold">التواصل الاجتماعي</h2>
              </div>
              <div><label className="block text-sm font-semibold mb-2">انستغرام (رابط)</label><input className={input} value={form.instagram || ""} onChange={set("instagram")} placeholder="https://instagram.com/..." /></div>
              <div><label className="block text-sm font-semibold mb-2">فيسبوك (رابط)</label><input className={input} value={form.facebook || ""} onChange={set("facebook")} placeholder="https://facebook.com/..." /></div>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>حفظ التغييرات</span>
        </button>
      </div>
    </div>
  );
}
