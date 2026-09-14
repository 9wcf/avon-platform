"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Lock, Mail, Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) { router.replace("/dashboard"); return null; }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) setError(error);
    else router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F8F4F0 0%, #E8B4B8 50%, #D4AF37 100%)" }}>
      {/* دوائر زجاجية متحركة بالخلفية */}
      <motion.div animate={{ y: [0, -30, 0], x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-10 right-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
      <motion.div animate={{ y: [0, 30, 0], x: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-10 left-10 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #D4AF37, #B76E79)" }}>
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-gradient-gold">AVON Luxury</h1>
          <p className="text-gray-500 mt-2">لوحة تحكم المركز</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B76E79]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="البريد الإلكتروني"
              className="w-full pr-12 pl-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition-all bg-white/70" />
          </div>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B76E79]" />
            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="كلمة السر"
              className="w-full pr-12 pl-12 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#D4AF37] focus:outline-none transition-all bg-white/70" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B76E79]">
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center border border-red-200">
              {error}
            </motion.div>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit"
            className="btn-luxury w-full py-3.5 rounded-xl font-bold text-lg disabled:opacity-60">
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </motion.button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 AVON Luxury Center</p>
      </motion.div>
    </div>
  );
}
