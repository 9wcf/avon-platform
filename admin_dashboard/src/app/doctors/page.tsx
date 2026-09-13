"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Stethoscope, Plus, Edit, Trash2, Upload, Search, Star, Phone, Mail, Loader2, X } from "lucide-react";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({ name: "", specialty: "", experience: "", phone: "", email: "", bio: "", rating: "5.0", image_url: "", is_active: true });

  useEffect(() => { fetchDoctors(); }, []);
  const fetchDoctors = async () => { try { const { data } = await supabase.from("doctors").select("*").order("created_at", { ascending: false }); setDoctors(data || []); } catch (error) { console.error(error); } finally { setIsLoading(false); } };

  const handleImageUpload = async (file: File) => { setUploading(true); try { const fileExt = file.name.split(".").pop(); const fileName = `doctor_${Date.now()}.${fileExt}`; await supabase.storage.from("doctors-images").upload(fileName, file); const { data } = supabase.storage.from("doctors-images").getPublicUrl(fileName); return data.publicUrl; } catch (error) { alert("فشل رفع الصورة"); return null; } finally { setUploading(false); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); } };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { let imageUrl = formData.image_url; const fileInput = (document.getElementById("doctor-image") as HTMLInputElement); if (fileInput?.files?.[0]) { const uploaded = await handleImageUpload(fileInput.files[0]); if (uploaded) imageUrl = uploaded; } const doctorData = { ...formData, rating: parseFloat(formData.rating), experience: parseInt(formData.experience), image_url: imageUrl }; if (editingDoctor) await supabase.from("doctors").update(doctorData).eq("id", editingDoctor.id); else await supabase.from("doctors").insert([doctorData]); fetchDoctors(); resetForm(); } catch (error) { alert("حدث خطأ"); } };
  const handleDelete = async (id: string) => { if (!confirm("حذف؟")) return; await supabase.from("doctors").delete().eq("id", id); fetchDoctors(); };
  const editDoctor = (doctor: any) => { setEditingDoctor(doctor); setFormData({ name: doctor.name || "", specialty: doctor.specialty || "", experience: doctor.experience?.toString() || "", phone: doctor.phone || "", email: doctor.email || "", bio: doctor.bio || "", rating: doctor.rating?.toString() || "5.0", image_url: doctor.image_url || "", is_active: doctor.is_active ?? true }); if (doctor.image_url) setImagePreview(doctor.image_url); setShowModal(true); };
  const resetForm = () => { setFormData({ name: "", specialty: "", experience: "", phone: "", email: "", bio: "", rating: "5.0", image_url: "", is_active: true }); setEditingDoctor(null); setShowModal(false); setImagePreview(""); };

  const filtered = doctors.filter(d => d.name?.includes(searchTerm) || d.specialty?.includes(searchTerm));

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-avon-gold to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold mb-2">إدارة الأطباء</h1><p className="text-gray-600">فريق الأطباء</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus className="w-5 h-5" /><span>إضافة طبيب</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي الأطباء" value={doctors.length} icon={Stethoscope} gradient="from-red-500 to-red-600" />
        <StatCard title="النشطون" value={doctors.filter(d => d.is_active).length} icon={Star} gradient="from-green-500 to-green-600" />
        <StatCard title="متوسط التقييم" value={doctors.length ? (doctors.reduce((s, d) => s + (d.rating || 0), 0) / doctors.length).toFixed(1) : "0"} icon={Star} gradient="from-yellow-500 to-yellow-600" />
        <StatCard title="التخصصات" value={[...new Set(doctors.map(d => d.specialty).filter(Boolean))].length} icon={Stethoscope} gradient="from-avon-gold to-pink-500" />
      </div>

      <div className="luxury-card bg-white p-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full text-center py-12 luxury-card bg-white"><Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">لا يوجد أطباء</p></div> : filtered.map((doctor) => (
          <div key={doctor.id} className="luxury-card bg-white group hover:scale-105 transition-all">
            <div className="flex items-start gap-4 mb-4">
              {doctor.image_url ? <img src={doctor.image_url} className="w-20 h-20 rounded-2xl object-cover" /> : <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center"><Stethoscope className="w-10 h-10 text-white" /></div>}
              <div className="flex-1"><h3 className="font-bold text-lg">{doctor.name}</h3><p className="text-sm text-avon-gold font-semibold">{doctor.specialty}</p><div className="flex items-center gap-1 mt-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="text-sm font-bold">{doctor.rating}</span></div></div>
            </div>
            <div className="space-y-2 text-sm">
              {doctor.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-avon-gold" /><span>{doctor.phone}</span></div>}
              {doctor.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-avon-gold" /><span>{doctor.email}</span></div>}
              {doctor.experience && <p className="text-gray-600">خبرة: {doctor.experience} سنة</p>}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => editDoctor(doctor)} className="flex-1 flex items-center justify-center gap-2 py-2 text-avon-gold hover:bg-avon-gold/10 rounded-xl"><Edit className="w-4 h-4" /><span>تعديل</span></button>
              <button onClick={() => handleDelete(doctor.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /><span>حذف</span></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">{editingDoctor ? "تعديل" : "إضافة"}</h2><button onClick={resetForm}><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">{imagePreview ? <img src={imagePreview} className="w-24 h-24 rounded-2xl object-cover" /> : <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-avon-gold"><Upload className="w-8 h-8 text-gray-400" /><input id="doctor-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" /></label>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2">الاسم *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">التخصص *</label><input type="text" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">الخبرة</label><input type="number" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
                <div><label className="block text-sm font-semibold mb-2">التقييم</label><input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
                <div><label className="block text-sm font-semibold mb-2">الهاتف</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
                <div><label className="block text-sm font-semibold mb-2">البريد</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div>
              </div>
              <div><label className="block text-sm font-semibold mb-2">نبذة</label><textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" rows={3} /></div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={resetForm} className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button><button type="submit" disabled={uploading} className="flex-1 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2">{uploading && <Loader2 className="w-5 h-5 animate-spin" />}{editingDoctor ? "حفظ" : "إضافة"}</button></div>
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
