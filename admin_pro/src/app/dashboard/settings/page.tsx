"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, Button } from "@/components/ui";
import { RequireRole } from "@/lib/auth";
import { motion } from "framer-motion";
import { Settings, Lock, LogOut, Database } from "lucide-react";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [toast, setToast] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3500);};

  const changePass = async () => {
    if (newPass.length < 6) { showToast("❌ كلمة السر يجب أن تكون 6 أحرف على الأقل"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) showToast("❌ " + error.message); else { showToast("✅ تم تغيير كلمة السر"); setNewPass(""); setOldPass(""); }
    setBusy(false);
  };

  return (
    <RequireRole roles={["admin"]}>
    <div className="space-y-6 max-w-2xl">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}><Settings className="w-6 h-6 text-white"/></div>
          <div><h2 className="text-xl font-extrabold text-gradient-gold">الإعدادات</h2><p className="text-sm text-gray-500">{user?.email}</p></div>
        </div>
        <div className="space-y-4">
          <div className="font-bold text-[#B76E79] border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4"/>تغيير كلمة السر</div>
          <div><label className="text-sm font-bold text-gray-600 mb-1 block">كلمة السر الجديدة</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="6 أحرف على الأقل" className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>
          <Button onClick={changePass} disabled={busy} className="w-full">{busy?"جاري التغيير...":"تغيير كلمة السر"}</Button>
          <div className="font-bold text-[#B76E79] border-b pb-2 mt-6 flex items-center gap-2"><Database className="w-4 h-4"/>النسخ الاحتياطي</div>
          <p className="text-sm text-gray-500">بياناتك محفوظة بأمان على Supabase مع نسخ احتياطي تلقائي يومي.</p>
          <Button variant="danger" onClick={()=>{if(confirm("هل أنت متأكد من تسجيل الخروج؟"))signOut();}} className="w-full mt-4"><LogOut className="w-4 h-4 inline ml-1"/>تسجيل الخروج</Button>
        </div>
      </Card>
    </div>
    </RequireRole>
  );
}
