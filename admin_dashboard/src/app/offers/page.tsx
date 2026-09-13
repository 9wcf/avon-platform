"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tag, Plus, Edit, Trash2, Upload, Search, Percent, Calendar, Loader2, X, Sparkles } from "lucide-react";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({ title_ar: "", description: "", discount_percentage: "", original_price: "", discounted_price: "", image_url: "", start_date: "", end_date: "", is_active: true });

  useEffect(() => { fetchOffers(); }, []);
  const fetchOffers = async () => { try { const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false }); setOffers(data || []); } catch (error) { console.error(error); } finally { setIsLoading(false); } };

  const handleImageUpload = async (file: File) => { setUploading(true); try { const fileExt = file.name.split(".").pop(); const fileName = `offer_${Date.now()}.${fileExt}`; await supabase.storage.from("offers-images").upload(fileName, file); const { data } = supabase.storage.from("offers-images").getPublicUrl(fileName); return data.publicUrl; } catch (error) { alert("فشل"); return null; } finally { setUploading(false); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); } };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { let imageUrl = formData.image_url; const fileInput = (document.getElementById("offer-image") as HTMLInputElement); if (fileInput?.files?.[0]) { const uploaded = await handleImageUpload(fileInput.files[0]); if (uploaded) imageUrl = uploaded; } const offerData = { ...formData, discount_percentage: parseFloat(formData.discount_percentage), original_price: parseFloat(formData.original_price), discounted_price: parseFloat(formData.discounted_price), image_url: imageUrl }; if (editingOffer) await supabase.from("offers").update(offerData).eq("id", editingOffer.id); else await supabase.from("offers").insert([offerData]); fetchOffers(); resetForm(); } catch (error) { alert("حدث خطأ"); } };
  const handleDelete = async (id: string) => { if (!confirm("حذف؟")) return; await supabase.from("offers").delete().eq("id", id); fetchOffers(); };
  const editOffer = (offer: any) => { setEditingOffer(offer); setFormData({ title_ar: offer.title_ar || "", description: offer.description || "", discount_percentage: offer.discount_percentage?.toString() || "", original_price: offer.original_price?.toString() || "", discounted_price: offer.discounted_price?.toString() || "", image_url: offer.image_url || "", start_date: offer.start_date || "", end_date: offer.end_date || "", is_active: offer.is_active ?? true }); if (offer.image_url) setImagePreview(offer.image_url); setShowModal(true); };
  const resetForm = () => { setFormData({ title_ar: "", description: "", discount_percentage: "", original_price: "", discounted_price: "", image_url: "", start_date: "", end_date: "", is_active: true }); setEditingOffer(null); setShowModal(false); setImagePreview(""); };

  const filtered = offers.filter(o => o.title_ar?.includes(searchTerm));
  const activeOffers = offers.filter(o => o.is_active);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-avon-gold to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" /><div className="relative w-16 h-16 border-4 border-avon-gold/20 border-t-avon-gold rounded-full animate-spin" /></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold mb-2">إدارة العروض</h1><p className="text-gray-600">العروض والخصومات</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus className="w-5 h-5" /><span>عرض جديد</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="إجمالي العروض" value={offers.length} icon={Tag} gradient="from-yellow-500 to-yellow-600" />
        <StatCard title="النشطة" value={activeOffers.length} icon={Sparkles} gradient="from-green-500 to-green-600" />
        <StatCard title="متوسط الخصم" value={`${offers.length ? Math.round(offers.reduce((s, o) => s + (o.discount_percentage || 0), 0) / offers.length) : 0}%`} icon={Percent} gradient="from-red-500 to-red-600" />
        <StatCard title="القيمة الموفرة" value={`${offers.reduce((s, o) => s + ((o.original_price - o.discounted_price) || 0), 0).toLocaleString()} د.ع`} icon={Tag} gradient="from-avon-gold to-pink-500" />
      </div>

      <div className="luxury-card bg-white p-6"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? <div className="col-span-full text-center py-12 luxury-card bg-white"><Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">لا توجد عروض</p></div> : filtered.map((offer) => (
          <div key={offer.id} className="luxury-card bg-white group hover:scale-105 transition-all overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold shadow-lg">خصم {offer.discount_percentage}%</div>
            {offer.image_url ? <img src={offer.image_url} className="w-full h-48 object-cover" /> : <div className="w-full h-48 bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center"><Sparkles className="w-16 h-16 text-white" /></div>}
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2">{offer.title_ar}</h3>
              {offer.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.description}</p>}
              <div className="flex items-center gap-3 mb-3"><span className="text-2xl font-bold text-avon-gold">{offer.discounted_price?.toLocaleString()} د.ع</span><span className="text-sm text-gray-400 line-through">{offer.original_price?.toLocaleString()} د.ع</span></div>
              {offer.start_date && offer.end_date && <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Calendar className="w-4 h-4" /><span>{new Date(offer.start_date).toLocaleDateString("ar-IQ")} - {new Date(offer.end_date).toLocaleDateString("ar-IQ")}</span></div>}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button onClick={() => editOffer(offer)} className="flex-1 flex items-center justify-center gap-2 py-2 text-avon-gold hover:bg-avon-gold/10 rounded-xl"><Edit className="w-4 h-4" /><span>تعديل</span></button>
                <button onClick={() => handleDelete(offer.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /><span>حذف</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">{editingOffer ? "تعديل" : "إنشاء"}</h2><button onClick={resetForm}><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">{imagePreview ? <img src={imagePreview} className="w-32 h-32 rounded-2xl object-cover" /> : <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-avon-gold"><Upload className="w-8 h-8 text-gray-400" /><input id="offer-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" /></label>}</div>
              <div><label className="block text-sm font-semibold mb-2">العنوان *</label><input type="text" value={formData.title_ar} onChange={(e) => setFormData({...formData, title_ar: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
              <div><label className="block text-sm font-semibold mb-2">الوصف</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" rows={2} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-2">السعر الأصلي *</label><input type="number" value={formData.original_price} onChange={(e) => setFormData({...formData, original_price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">السعر بعد الخصم *</label><input type="number" value={formData.discounted_price} onChange={(e) => setFormData({...formData, discounted_price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">الخصم % *</label><input type="number" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2">تاريخ البداية *</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
                <div><label className="block text-sm font-semibold mb-2">تاريخ النهاية *</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required /></div>
              </div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={resetForm} className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button><button type="submit" disabled={uploading} className="flex-1 py-3 bg-gradient-to-r from-avon-gold to-pink-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2">{uploading && <Loader2 className="w-5 h-5 animate-spin" />}{editingOffer ? "حفظ" : "إنشاء"}</button></div>
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
