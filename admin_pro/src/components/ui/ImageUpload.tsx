"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";

export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("❌ اختر ملف صورة فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("❌ الصورة كبيرة جداً (الحد 5MB)"); return; }

    setUploading(true); setError("");
    try {
      const ext = file.name.split(".").pop();
      const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage.from("clinic-images").upload(fileName, file, { contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("clinic-images").getPublicUrl(data.path);
      onChange(pub.publicUrl);
    } catch (err: any) {
      setError("❌ فشل الرفع: " + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-sm font-bold text-gray-600 mb-1 block">صورة</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-[#E8B4B8]">
          <img src={value} alt="" className="w-full h-40 object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 left-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600"><X className="w-4 h-4 text-white" /></button>
          <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-2 left-2 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-bold text-[#B76E79] hover:bg-white">تغيير</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full h-40 rounded-xl border-2 border-dashed border-[#E8B4B8] hover:border-[#B76E79] hover:bg-[#B76E79]/5 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-60">
          {uploading ? <Loader2 className="w-8 h-8 text-[#B76E79] animate-spin" /> : <><Upload className="w-8 h-8 text-[#B76E79]" /><span className="font-bold text-[#B76E79] text-sm">اضغط لرفع صورة</span><span className="text-xs text-gray-400">PNG, JPG • حد أقصى 5MB</span></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
}
