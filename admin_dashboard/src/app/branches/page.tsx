"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, Plus, Edit, Trash2, Upload, Search, Phone, Clock, Loader2, X, Building2 } from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({ name_ar: "", address: "", phone: "", working_hours: "", image_url: "", is_active: true });

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("branches").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setBranches(data || []);
    } catch (error) { console.error("Error fetching branches:", error); } finally { setIsLoading(false); }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `branch_${Date.now()}.${fileExt}`;
      await supabase.storage.from("branches-images").upload(fileName, file);
      const { data } = supabase.storage.from("branches-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error("Upload error:", error); alert("فشل رفع الصورة"); return null; } finally { setUploading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url;
      const fileInput = (document.getElementById("branch-image") as HTMLInputElement);
      if (fileInput?.files?.[0]) {
        const uploaded = await handleImageUpload(fileInput.files[0]);
        if (uploaded) imageUrl = uploaded;
      }
      const branchData = { ...formData, image_url: imageUrl };
      if (editingBranch) {
        const { error } = await supabase.from("branches").update(branchData).eq("id", editingBranch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert([branchData]);
        if (error) throw error;
      }
      await fetchBranches(); // تحديث فوري للبيانات
      resetForm();
    } catch (error: any) {
      console.error("Error saving branch:", error);
      alert(`حدث خطأ: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفرع؟\n\nسيتم حذف الفرع نهائياً من النظام.")) return;
    
    try {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
      
      // تحديث فوري - حذف من القائمة
      setBranches(branches.filter(b => b.id !== id));
      alert("تم حذف الفرع بنجاح");
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      alert(`فشل الحذف: ${error.message}`);
    }
  };

  const editBranch = (branch: any) => {
    setEditingBranch(branch);
    setFormData({ name_ar: branch.name_ar || "", address: branch.address || "", phone: branch.phone || "", working_hours: branch.working_hours || "", image_url: branch.image_url || "", is_active: branch.is_active ?? true });
    if (branch.image_url) setImagePreview(branch.image_url);
    setShowModal(true);
  };

  const addNewBranch = () => { resetForm(); setShowModal(true); };

  const resetForm = () => {
    setFormData({ name_ar: "", address: "", phone: "", working_hours: "", image_url: "", is_active: true });
    setEditingBranch(null);
    setImagePreview("");
    const fileInput = document.getElementById("branch-image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const closeModal = () => { setShowModal(false); setTimeout(() => resetForm(), 300); };

  const filtered = branches.filter(b => b.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) || b.address?.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: branches.length, active: branches.filter(b => b.is_active).length, inactive: branches.filter(b => !b.is_active).length };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الفروع</h1><p className="text-gray-600">إضافة وإدارة فروع المركز</p></div>
        <button onClick={addNewBranch} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"><Plus className="w-5 h-5" /><span>إضافة فرع جديد</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي الفروع" value={stats.total} icon={Building2} gradient="from-orange-500 to-orange-600" />
        <StatCard title="النشطة" value={stats.active} icon={MapPin} gradient="from-green-500 to-green-600" />
        <StatCard title="المعطلة" value={stats.inactive} icon={MapPin} gradient="from-red-500 to-red-600" />
      </div>

      <div className="luxury-card bg-white p-6">
        <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث عن فرع..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50" /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full text-center py-12 luxury-card bg-white"><MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 text-lg">{searchTerm ? "لا توجد فروع تطابق بحثك" : "لا توجد فروع"}</p><p className="text-gray-400 text-sm">{searchTerm ? "جرب البحث بكلمات أخرى" : 'اضغط على "إضافة فرع جديد" للبدء'}</p></div> : filtered.map((branch) => (
          <div key={branch.id} className="luxury-card bg-white group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="relative h-48 bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden">
              {branch.image_url ? <img src={branch.image_url} alt={branch.name_ar} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden'); }} /> : null}
              <div className={`fallback-icon absolute inset-0 flex items-center justify-center ${branch.image_url ? '' : 'hidden'}`}><MapPin className="w-16 h-16 text-white/80" /></div>
              {!branch.is_active && <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg">معطل</div>}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl mb-3 text-gray-900">{branch.name_ar}</h3>
              <div className="space-y-3 text-sm">
                {branch.address && <div className="flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" /><span className="line-clamp-2">{branch.address}</span></div>}
                {branch.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" /><span>{branch.phone}</span></div>}
                {branch.working_hours && <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-[#D4AF37] flex-shrink-0" /><span>{branch.working_hours}</span></div>}
              </div>
              <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100">
                <button onClick={() => editBranch(branch)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl transition-all font-semibold"><Edit className="w-4 h-4" /><span>تعديل</span></button>
                <button onClick={() => handleDelete(branch.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold"><Trash2 className="w-4 h-4" /><span>حذف</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-6 h-6 text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الفرع</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? <div className="relative w-32 h-32 rounded-2xl overflow-hidden"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => { setImagePreview(""); const fileInput = document.getElementById("branch-image") as HTMLInputElement; if (fileInput) fileInput.value = ""; }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></div> : <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#D4AF37] transition-colors bg-gray-50"><Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-xs text-gray-500 text-center px-2">اختر صورة</span><input id="branch-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" /></label>}
                  <div className="flex-1"><p className="text-sm text-gray-500 mb-1">{imagePreview ? "يمكنك تغيير الصورة" : "اضغط لرفع صورة للفرع"}</p><p className="text-xs text-gray-400">الحد الأقصى: 5MB</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">اسم الفرع (عربي) <span className="text-red-500">*</span></label><input type="text" value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50" placeholder="مثال: فرع الكرادة" required /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">العنوان <span className="text-red-500">*</span></label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50" placeholder="مثال: بغداد، الكرادة، شارع 60" required /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50" placeholder="0770 123 4567" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">ساعات العمل</label><input type="text" value={formData.working_hours} onChange={(e) => setFormData({...formData, working_hours: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#D4AF37]/50" placeholder="09:00 ص - 10:00 م" /></div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded-lg border-2 border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]" /><label htmlFor="is_active" className="text-sm font-semibold text-gray-700 cursor-pointer">الفرع نشط (سيظهر في التطبيق)</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold">إلغاء</button>
                <button type="submit" disabled={uploading} className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E8B4B8] text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2">{uploading && <Loader2 className="w-5 h-5 animate-spin" />}<span>{editingBranch ? "حفظ التعديلات" : "إضافة الفرع"}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient }: any) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
      <div className="relative luxury-card bg-white group-hover:transform group-hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-600 mb-1">{title}</p><h4 className="text-3xl font-bold text-gray-900">{value}</h4></div>
          <div className={`p-4 bg-gradient-to-r ${gradient} rounded-2xl shadow-lg`}><Icon className="w-7 h-7 text-white" /></div>
        </div>
      </div>
    </div>
  );
}
