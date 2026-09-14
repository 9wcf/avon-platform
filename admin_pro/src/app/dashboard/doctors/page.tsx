"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, Badge } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Stethoscope, Power } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function DoctorsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", specialty: "", bio: "", experience_years: "5", image_url: "", is_active: true });
  const [toast, setToast] = useState<string|null>(null);
  const showToast = (m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  const load = async () => { const { data } = await supabase.from("doctors").select("*").order("created_at",{ascending:false}); setItems(data||[]); setLoading(false); };
  useEffect(()=>{load();const ch=supabase.channel("doc").on("postgres_changes",{event:"*",schema:"public",table:"doctors"},()=>load()).subscribe();return ()=>{supabase.removeChannel(ch);};},[]);

  const openAdd=()=>{setEditing(null);setForm({name:"",specialty:"",bio:"",experience_years:"5",image_url:"",is_active:true});setModalOpen(true);};
  const openEdit=(d:any)=>{setEditing(d);setForm({name:d.name,specialty:d.specialty,bio:d.bio||"",experience_years:(d.experience_years||5).toString(),image_url:d.image_url||"",is_active:d.is_active??true});setModalOpen(true);};

  const save=async()=>{
    if(!form.name||!form.specialty){showToast("❌ الاسم والتخصص مطلوبين");return;}
    const payload={name:form.name,specialty:form.specialty,bio:form.bio,experience_years:Number(form.experience_years),image_url:form.image_url,is_active:form.is_active};
    if(editing){await supabase.from("doctors").update(payload).eq("id",editing.id);showToast("✅ تم التعديل");}
    else{await supabase.from("doctors").insert(payload);showToast("✅ تمت الإضافة");}
    setModalOpen(false);load();
  };
  const del=async(id:string)=>{if(!confirm("هل أنت متأكد؟"))return;await supabase.from("doctors").delete().eq("id",id);showToast("🗑️ تم الحذف");load();};
  const toggle=async(d:any)=>{await supabase.from("doctors").update({is_active:!d.is_active}).eq("id",d.id);load();};

  return (
    <div className="space-y-6">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <div className="flex items-center justify-between"><p className="text-gray-500">{items.length} طبيب</p><Button onClick={openAdd}><Plus className="w-4 h-4 inline ml-1"/>إضافة طبيب</Button></div>
      {loading?<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{[1,2,3,4].map(i=><div key={i} className="h-56 rounded-2xl shimmer bg-gray-200/50"/>)}</div>:
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((d,i)=>(
          <motion.div key={d.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
            <Card className="!p-4 text-center">
              <div className="relative inline-block mb-3">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#E8B4B8]" style={{background:"linear-gradient(135deg,#E8B4B8,#B76E79)"}}>
                  {d.image_url?<img src={d.image_url} alt="" className="w-full h-full object-cover"/>:<Stethoscope className="w-10 h-10 text-white m-auto mt-7"/>}
                </div>
                <button onClick={()=>toggle(d)} className={"absolute -top-1 -right-1 p-1.5 rounded-full "+(d.is_active!==false?"bg-green-500":"bg-gray-400")}><Power className="w-3 h-3 text-white"/></button>
              </div>
              <h3 className="font-extrabold text-gray-800 dark:text-gray-100">{d.name}</h3>
              <p className="text-xs text-[#B76E79] font-bold mb-1">{d.specialty}</p>
              <p className="text-xs text-gray-500 mb-3">{d.experience_years||0} سنة خبرة</p>
              <div className="flex justify-center gap-1">
                <button onClick={()=>openEdit(d)} className="p-2 hover:bg-[#D4AF37]/10 rounded-lg"><Edit2 className="w-4 h-4 text-[#D4AF37]"/></button>
                <button onClick={()=>del(d.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?"تعديل الطبيب":"إضافة طبيب"}>
        <div className="space-y-4">
          <F label="الاسم" value={form.name} onChange={v=>setForm({...form,name:v})}/>
          <F label="التخصص" value={form.specialty} onChange={v=>setForm({...form,specialty:v})}/>
          <div><label className="text-sm font-bold text-gray-600 mb-1 block">السيرة الذاتية</label><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={3} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <F label="سنوات الخبرة" value={form.experience_years} onChange={v=>setForm({...form,experience_years:v})} type="number"/>
            <ImageUpload value={form.image_url} onChange={v=>setForm({...form,image_url:v})}/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} className="w-5 h-5 accent-[#B76E79]"/><span className="font-bold text-gray-700">نشط</span></label>
          <Button onClick={save} className="w-full">{editing?"حفظ التعديلات":"إضافة الطبيب"}</Button>
        </div>
      </Modal>
    </div>
  );
}
function F({label,value,onChange,type="text"}:any){return(<div><label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>);}
