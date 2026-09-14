"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button } from "@/components/ui";
import { motion } from "framer-motion";
import { Send, Users, Bell, Megaphone } from "lucide-react";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all"|"pending">("all");
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<string|null>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3500);};

  useEffect(() => { loadCount(); }, [target]);
  const loadCount = async () => {
    let q = supabase.from("profiles").select("*", { count: "exact", head: true });
    if (target === "pending") {
      const { data } = await supabase.from("appointments").select("patient_id").eq("status", "pending");
      setCount(data?.length || 0);
    } else {
      const { count: c } = await q;
      setCount(c || 0);
    }
  };

  const send = async () => {
    if (!title.trim() || !body.trim()) { showToast("❌ العنوان والمطلوب مطلوبين"); return; }
    setSending(true);
    try {
      let userIds: string[] = [];
      if (target === "pending") {
        const { data } = await supabase.from("appointments").select("patient_id").eq("status", "pending");
        userIds = [...new Set((data || []).map((d: any) => d.patient_id))];
      } else {
        const { data } = await supabase.from("profiles").select("id");
        userIds = (data || []).map((d: any) => d.id);
      }
      if (userIds.length === 0) { showToast("❌ لا يوجد مستلمين"); setSending(false); return; }
      const notifs = userIds.map(id => ({ user_id: id, title: title.trim(), body: body.trim(), type: "admin_message" }));
      const { error } = await supabase.from("notifications").insert(notifs);
      if (error) throw error;
      showToast("✅ تم إرسال الإشعار لـ " + userIds.length + " مستخدم");
      setTitle(""); setBody("");
    } catch (e: any) { showToast("❌ فشل: " + e.message); }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}><Megaphone className="w-6 h-6 text-white"/></div>
          <div><h2 className="text-xl font-extrabold text-gradient-gold">إشعار جماعي</h2><p className="text-sm text-gray-500">أرسل إشعاراً لكل الزبائن أو لمجموعة محددة</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-2 block">المستلمون</label>
            <div className="flex gap-2">
              <button onClick={()=>setTarget("all")} className={"flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all "+(target==="all"?"border-[#D4AF37] bg-[#D4AF37]/10 text-[#B76E79]":"border-gray-200 text-gray-500")}><Users className="w-4 h-4 inline ml-1"/>كل الزبائن</button>
              <button onClick={()=>setTarget("pending")} className={"flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all "+(target==="pending"?"border-[#D4AF37] bg-[#D4AF37]/10 text-[#B76E79]":"border-gray-200 text-gray-500")}><Bell className="w-4 h-4 inline ml-1"/>قيد الانتظار فقط</button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">سيصل الإشعار لـ <span className="font-bold text-[#B76E79]">{count}</span> مستخدم</p>
          </div>
          <div><label className="text-sm font-bold text-gray-600 mb-1 block">عنوان الإشعار</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثال: عرض خاص هذا الأسبوع" className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>
          <div><label className="text-sm font-bold text-gray-600 mb-1 block">نص الإشعار</label><textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} placeholder="اكتب تفاصيل الإشعار..." className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>
          <Button onClick={send} disabled={sending} className="w-full">{sending?"جاري الإرسال...":"إرسال الإشعار"}</Button>
        </div>
      </Card>
    </div>
  );
}
