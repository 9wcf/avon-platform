"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Flower2, Plus, Edit, Trash2, Upload, Search, Clock, DollarSign, Loader2, X, Eye, EyeOff } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({ name_ar: "", name_en: "", price_iqd: "", duration_minutes: "45", description: "", category: "", is_active: true, image_url: "" });

  useEffect(() => { fetchServices(); }, []);
  const fetchServices = async () => { try { const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false }); setServices(data || []); } catch (error) { console.error(error); } finally { setIsLoading(false); } };

  const handleImageUpload = async (file: File) => { setUploading(true); try { const fileExt = file.name.split(".").pop(); const fileName = `service_${Date.now()}.${fileExt}`; await supabase.storage.from("services-images").upload(fileName, file); const { data } = supabase.storage.from("services-images").getPublicUrl(fileName); return data.publicUrl; } catch (error) { alert("فشل رفع الصورة"); return null; } finally { setUploading(false); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); } };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { let imageUrl = formData.image_url; const fileInput = (document.getElementById("service-image") as HTMLInputElement); if (fileInput?.files?.[0]) { const uploaded = await handleImageUpload(fileInput.files[0]); if (uploaded) imageUrl = uploaded; } const serviceData = { ...formData, price_iqd: parseFloat(formData.price_iqd), duration_minutes: parseInt(formData.duration_minutes), image_url: imageUrl }; if (editingService) await supabase.from("services").update(serviceData).eq("id", editingService.id); else await supabase.from("services").insert([serviceData]); fetchServices(); resetForm(); } catch (error) { alert("حدث خطأ"); } };
  const handleDelete = async (id: string) => { if (!confirm("حذف؟")) return; await supabase.from("services").delete().eq("id", id); fetchServices(); };
  const editService = (service: any) => { setEditingService(service); setFormData({ name_ar: service.name_ar || "", name_en: service.name_en || "", price_iqd: service.price_iqd?.toString() || "", duration_minutes: service.duration_minutes?.toString() || "45", description: service.description || "", category: service.category || "", is_active: service.is_active ?? true, image_url: service.image_url || "" }); if (service.image_url) setImagePreview(service.image_url); setShowModal(true); };
  const resetForm = () => { setFormData({ name_ar: "", name_en: "", price_iqd: "", duration_minutes: "45", description: "", category: "", is_active: true, image_url: "" }); setEditingService(null); setShowModal(false); setImagePreview(""); };

  const filtered = services.filter(s => s.name_ar?.includes(searchTerm) || s.category?.includes(searchTerm));

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-avon-gold to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold mb-2">إدارة الخدمات</h1><p className="text-gray-600">إضافة وتعديل الخدمات</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus className="w-5 h-5" /><span>إضافة خدمة</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي الخدمات" value={services.length} icon={Flower2} gradient="from-pink-500 to-pink-600" />
        <StatCard title="النشطة" value={services.filter(s => s.is_active).length} icon={Eye} gradient="from-green-500 to-green-600" />
        <StatCard title="المعطلة" value={services.filter(s => !s.is_active).length} icon={EyeOff} gradient="from-red-500 to-red-600" />
        <StatCard title="متوسط السعر" value={`${services.length ? Math.round(services.reduce((s, x) => s + (x.price_iqd || 0), 0) / services.length).toLocaleString() : 0} د.ع`} icon={DollarSign} gradient="from-avon-gold to-pink-500" />
      </div>

      <div className="luxury-card bg-white p-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full text-center py-12 luxury-card bg-white"><Flower2 className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">لا توجد خدمات</p></div> : filtered.map((service) => (
          <div key={service.id} className="luxury-card bg-white group hover:scale-105 transition-all">
            {service.image_url && <img src={service.image_url} alt={service.name_ar} className="w-full h-48 object-cover rounded-xl mb-4" />}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1"><h3 className="font-bold text-xl mb-1">{service.name_ar}</h3>{service.name_en && <p className="text-sm text-gray-500">{service.name_en}</p>}{service.category && <span className="inline-block mt-2 px-3 py-1 bg-avon-gold/10 text-avon-gold text-xs font-semibold rounded-full">{service.category}</span>}</div>
              <div className="flex gap-2"><button onClick={() => editService(service)} className="p-2 text-avon-gold hover:bg-avon-gold/10 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={() => handleDelete(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></div>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-100"><div className="flex justify-between text-sm"><span className="text-gray-600">السعر:</span><span className="font-bold text-avon-gold">{service.price_iqd?.toLocaleString()} د.ع</span></div><div className="flex justify-between text-sm"><span className="text-gray-600">المدة:</span><span>{service.duration_minutes} دقيقة</span></div></div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">{editingService ? "تعديل" : "إضافة"}</h2><button onClick={resetForm}><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">{imagePreview ? <img src={imagePreview} className="w-24 h-24 rounded-2xl object-cover" /> : <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-avon-gold"><Upload className="w-8 h-8 text-gray-400" /><input id="service-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" /></label>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2">الاسم (عربي) *</label><input type="text" value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">الاسم (إنجليزي)</label><input type="text" value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
                <div><label className="block text-sm font-semibold mb-2">السعر *</label><input type="number" value={formData.price_iqd} onChange={(e) => setFormData({...formData, price_iqd: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">المدة (دقيقة) *</label><input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
              </div>
              <div><label className="block text-sm font-semibold mb-2">التصنيف</label><input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
              <div><label className="block text-sm font-semibold mb-2">الوصف</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" rows={3} /></div>
              <div className="flex items-center gap-3"><input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5" /><label htmlFor="is_active" className="text-sm font-semibold">نشطة</label></div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={resetForm} className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button><button type="submit" disabled={uploading} className="flex-1 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2">{uploading && <Loader2 className="w-5 h-5 animate-spin" />}{editingService ? "حفظ" : "إضافة"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient }: any) {
  return (<div className="relative group"><div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} /><div className="relative luxury-card bg-white group-hover:scale-105 transition-all"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">{title}</p><h4 className="text-2xl font-bold">{value}</h4></div><div className={`p-3 bg-gradient-to-r ${gradient} rounded-2xl shadow-lg`}><Icon className="w-6 h-6 text-white" /></div></div></div></div>);
}
