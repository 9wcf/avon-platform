"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, Badge } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, MapPin, Phone, Power } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function BranchesPage() {
  const [items,setItems]=useState<any[]>([]);const [loading,setLoading]=useState(true);
  const [modalOpen,setModalOpen]=useState(false);const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState({name_ar:"",address:"",phone:"",image_url:"",is_active:true});
  const [toast,setToast]=useState<string|null>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  const load=async()=>{const {data}=await supabase.from("branches").select("*").order("created_at",{ascending:false});setItems(data||[]);setLoading(false);};
  useEffect(()=>{load();const ch=supabase.channel("br").on("postgres_changes",{event:"*",schema:"public",table:"branches"},()=>load()).subscribe();return ()=>{supabase.removeChannel(ch);};},[]);

  const openAdd=()=>{setEditing(null);setForm({name_ar:"",address:"",phone:"",image_url:"",is_active:true});setModalOpen(true);};
  const openEdit=(b:any)=>{setEditing(b);setForm({name_ar:b.name_ar,address:b.address||"",phone:b.phone||"",image_url:b.image_url||"",is_active:b.is_active??true});setModalOpen(true);};
  const save=async()=>{
    if(!form.name_ar){showToast("❌ اسم الفرع مطلوب");return;}
    const payload={name_ar:form.name_ar,address:form.address,phone:form.phone,image_url:form.image_url,is_active:form.is_active};
    try{
      const res=editing?await supabase.from("branches").update(payload).eq("id",editing.id).select():await supabase.from("branches").insert(payload).select();
      if(res.error){showToast("❌ فشل: "+res.error.message);return;}
      if(!res.data||res.data.length===0){showToast("❌ لم يتم حفظ البيانات");return;}
      showToast(editing?"✅ تم التعديل":"✅ تمت الإضافة");
      setModalOpen(false);
      await load();
    }catch(e:any){showToast("❌ خطأ: "+e.message);}
  };
  const del=async(id:string)=>{if(!confirm("هل أنت متأكد؟"))return;const r=await supabase.from("branches").delete().eq("id",id);if(r.error){showToast("❌ فشل الحذف: "+r.error.message);return;}showToast("🗑️ تم الحذف");load();};
  const toggle=async(b:any)=>{await supabase.from("branches").update({is_active:!b.is_active}).eq("id",b.id);load();};

  return (
    <div className="space-y-6">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <div className="flex items-center justify-between"><p className="text-gray-500">{items.length} فرع</p><Button onClick={openAdd}><Plus className="w-4 h-4 inline ml-1"/>إضافة فرع</Button></div>
      {loading?<div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[1,2].map(i=><div key={i} className="h-40 rounded-2xl shimmer bg-gray-200/50"/>)}</div>:
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((b,i)=>(
          <motion.div key={b.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
            <Card className="!p-0 overflow-hidden">
              <div className="h-28 relative">
                {b.image_url?<img src={b.image_url} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}><MapPin className="w-10 h-10 text-white"/></div>}
                <button onClick={()=>toggle(b)} className={"absolute top-3 left-3 p-2 rounded-full "+(b.is_active!==false?"bg-green-500":"bg-gray-400")}><Power className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2"><h3 className="font-extrabold text-gray-800 dark:text-gray-100">{b.name_ar}</h3><Badge color={b.is_active!==false?"green":"gray"}>{b.is_active!==false?"نشط":"معطل"}</Badge></div>
                <p className="text-sm text-gray-500 flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-[#D4AF37]"/>{b.address||"—"}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2 mb-3"><Phone className="w-4 h-4 text-[#D4AF37]"/>{b.phone||"—"}</p>
                <div className="flex gap-1 justify-end">
                  <button onClick={()=>openEdit(b)} className="p-2 hover:bg-[#D4AF37]/10 rounded-lg"><Edit2 className="w-4 h-4 text-[#D4AF37]"/></button>
                  <button onClick={()=>del(b.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?"تعديل الفرع":"إضافة فرع"}>
        <div className="space-y-4">
          <F label="اسم الفرع" value={form.name_ar} onChange={v=>setForm({...form,name_ar:v})}/>
          <F label="العنوان" value={form.address} onChange={v=>setForm({...form,address:v})}/>
          <F label="الهاتف" value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
          <ImageUpload value={form.image_url} onChange={v=>setForm({...form,image_url:v})}/>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} className="w-5 h-5 accent-[#B76E79]"/><span className="font-bold text-gray-700">نشط</span></label>
          <Button onClick={save} className="w-full">{editing?"حفظ التعديلات":"إضافة الفرع"}</Button>
        </div>
      </Modal>
    </div>
  );
}
function F({label,value,onChange}:any){return(<div><label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label><input value={value} onChange={e=>onChange(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>);}
