"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { RequireRole } from "@/lib/auth";
import { motion } from "framer-motion";
import { Shield, Crown, UserCog, Activity, Mail } from "lucide-react";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users"|"logs">("users");
  const [toast, setToast] = useState<string|null>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  const load = async () => {
    const [{ data: a }, { data: l }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_logs").select("*, profiles:admin_id(email)").order("created_at", { ascending: false }).limit(50),
    ]);
    setAdmins(a || []); setLogs(l || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (p: any, role: string) => {
    await supabase.from("profiles").update({ role, is_admin: role === "admin" }).eq("id", p.id);
    await supabase.from("admin_logs").insert({ action: "change_role", target_table: "profiles", target_id: p.id, details: { new_role: role, email: p.email } });
    showToast(role === "admin" ? "👑 تم تعيينه مديراً" : "👤 تم تعيينه موظفاً");
    load();
  };

  return (
    <RequireRole roles={["admin"]}>
    <div className="space-y-6">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <div className="flex gap-2">
        <button onClick={()=>setTab("users")} className={"px-5 py-2.5 rounded-xl font-bold text-sm "+(tab==="users"?"text-white":"bg-white text-gray-600 border border-gray-200")} style={tab==="users"?{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}:{}}><UserCog className="w-4 h-4 inline ml-1"/>المستخدمين والصلاحيات</button>
        <button onClick={()=>setTab("logs")} className={"px-5 py-2.5 rounded-xl font-bold text-sm "+(tab==="logs"?"text-white":"bg-white text-gray-600 border border-gray-200")} style={tab==="logs"?{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}:{}}><Activity className="w-4 h-4 inline ml-1"/>سجل النشاط</button>
      </div>
      {tab === "users" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map((p, i) => (
            <motion.div key={p.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}>
              <Card className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{background: p.role==="admin"?"linear-gradient(135deg,#D4AF37,#B76E79)":"linear-gradient(135deg,#E8B4B8,#B76E79)"}}>{(p.email||"?")[0].toUpperCase()}</div>
                    <div><p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{p.email}</p><Badge color={p.role==="admin"?"gold":"gray"}>{p.role==="admin"?"مدير":"موظف استقبال"}</Badge></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>setRole(p,"admin")} className={"p-2 rounded-lg "+(p.role==="admin"?"bg-[#D4AF37]/20":"hover:bg-gray-100")} title="مدير"><Crown className="w-4 h-4 text-[#D4AF37]"/></button>
                    <button onClick={()=>setRole(p,"staff")} className={"p-2 rounded-lg "+(p.role!=="admin"?"bg-[#B76E79]/20":"hover:bg-gray-100")} title="موظف"><UserCog className="w-4 h-4 text-[#B76E79]"/></button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {logs.length === 0 && <p className="text-center text-gray-400 py-8">لا يوجد نشاط مسجل</p>}
            {logs.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm">
                <Activity className="w-4 h-4 text-[#D4AF37] flex-shrink-0"/>
                <div className="flex-1"><span className="font-bold">{l.profiles?.email || "النظام"}</span> <span className="text-gray-500">قام بـ {l.action}</span>{l.details?.email && <span className="text-gray-500"> على {l.details.email}</span>}</div>
                <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleString("ar-IQ")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
    </RequireRole>
  );
}
