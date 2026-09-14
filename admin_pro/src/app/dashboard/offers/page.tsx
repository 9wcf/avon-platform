"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button, Badge } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { formatIQD } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Tag, Power } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function OffersPage() {
  const [items,setItems]=useState<any[]>([]);const [loading,setLoading]=useState(true);
  const [modalOpen,setModalOpen]=useState(false);const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState({title_ar:"",original_price:"",discount_percentage:"20",image_url:"",is_active:true});
  const [toast,setToast]=useState<string|null>(null);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  const load=async()=>{const {data}=await supabase.from("offers").select("*").order("created_at",{ascending:false});setItems(data||[]);setLoading(false);};
  useEffect(()=>{load();const ch=supabase.channel("off").on("postgres_changes",{event:"*",schema:"public",table:"offers"},()=>load()).subscribe();return ()=>{supabase.removeChannel(ch);};},[]);

  const discounted=(o:number,d:number)=>Math.round(o*(1-d/100));
  const openAdd=()=>{setEditing(null);setForm({title_ar:"",original_price:"",discount_percentage:"20",image_url:"",is_active:true});setModalOpen(true);};
  const openEdit=(o:any)=>{setEditing(o);setForm({title_ar:o.title_ar,original_price:o.original_price.toString(),discount_percentage:(o.discount_percentage||0).toString(),image_url:o.image_url||"",is_active:o.is_active??true});setModalOpen(true);};
  const save=async()=>{
    if(!form.title_ar||!form.original_price){showToast("❌ العنوان والسعر مطلوبين");return;}
    const orig=Number(form.original_price);const disc=Number(form.discount_percentage);
    const payload={title_ar:form.title_ar,original_price:orig,discount_percentage:disc,discounted_price:discounted(orig,disc),image_url:form.image_url,is_active:form.is_active};
    if(editing){await supabase.from("offers").update(payload).eq("id",editing.id);showToast("✅ تم التعديل");}
    else{await supabase.from("offers").insert(payload);showToast("✅ تمت الإضافة");}
    setModalOpen(false);load();
  };
  const del=async(id:string)=>{if(!confirm("هل أنت متأكد؟"))return;await supabase.from("offers").delete().eq("id",id);showToast("🗑️ تم الحذف");load();};
  const toggle=async(o:any)=>{await supabase.from("offers").update({is_active:!o.is_active}).eq("id",o.id);load();};

  return (
    <div className="space-y-6">
      {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}>{toast}</motion.div>}
      <div className="flex items-center justify-between"><p className="text-gray-500">{items.length} عرض</p><Button onClick={openAdd}><Plus className="w-4 h-4 inline ml-1"/>إضافة عرض</Button></div>
      {loading?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3].map(i=><div key={i} className="h-48 rounded-2xl shimmer bg-gray-200/50"/>)}</div>:
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((o,i)=>(
          <motion.div key={o.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
            <Card className="!p-0 overflow-hidden">
              <div className="h-32 relative">
                {o.image_url?<img src={o.image_url} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center" style={{background:"linear-gradient(135deg,#D4AF37,#B76E79)"}}><Tag className="w-10 h-10 text-white"/></div>}
                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full"><span className="font-extrabold text-[#B76E79]">خصم {o.discount_percentage}%</span></div>
                <button onClick={()=>toggle(o)} className={"absolute top-3 left-3 p-2 rounded-full "+(o.is_active!==false?"bg-green-500":"bg-gray-400")}><Power className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2"><h3 className="font-extrabold text-gray-800 dark:text-gray-100">{o.title_ar}</h3><Badge color={o.is_active!==false?"green":"gray"}>{o.is_active!==false?"نشط":"معطل"}</Badge></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-extrabold text-[#B76E79] text-lg">{formatIQD(o.discounted_price)}</span>
                  <span className="text-gray-400 line-through text-sm">{formatIQD(o.original_price)}</span>
                </div>
                <div className="flex gap-1 justify-end">
                  <button onClick={()=>openEdit(o)} className="p-2 hover:bg-[#D4AF37]/10 rounded-lg"><Edit2 className="w-4 h-4 text-[#D4AF37]"/></button>
                  <button onClick={()=>del(o.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500"/></button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?"تعديل العرض":"إضافة عرض"}>
        <div className="space-y-4">
          <F label="عنوان العرض" value={form.title_ar} onChange={v=>setForm({...form,title_ar:v})}/>
          <div className="grid grid-cols-2 gap-3">
            <F label="السعر الأصلي (د.ع)" value={form.original_price} onChange={v=>setForm({...form,original_price:v})} type="number"/>
            <F label="نسبة الخصم %" value={form.discount_percentage} onChange={v=>setForm({...form,discount_percentage:v})} type="number"/>
          </div>
          {form.original_price&&<div className="p-3 bg-green-50 rounded-xl text-center"><span className="text-gray-500 text-sm">السعر بعد الخصم: </span><span className="font-extrabold text-green-600">{formatIQD(discounted(Number(form.original_price),Number(form.discount_percentage)))}</span></div>}
          <ImageUpload value={form.image_url} onChange={v=>setForm({...form,image_url:v})}/>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} className="w-5 h-5 accent-[#B76E79]"/><span className="font-bold text-gray-700">نشط</span></label>
          <Button onClick={save} className="w-full">{editing?"حفظ التعديلات":"إضافة العرض"}</Button>
        </div>
      </Modal>
    </div>
  );
}
function F({label,value,onChange,type="text"}:any){return(<div><label className="text-sm font-bold text-gray-600 mb-1 block">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none"/></div>);}
