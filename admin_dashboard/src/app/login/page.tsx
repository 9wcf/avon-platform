"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { Flower2, Mail, Lock } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // التحقق من أن المستخدم مدير (يمكن إضافة هذا الحقل لاحقاً)
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "حدث خطأ في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-avon-ivory via-avon-beige to-avon-gold/20">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-avon-beige">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-avon-gold">
            <Flower2 className="w-10 h-10 text-avon-gold" />
          </div>
          <h1 className="text-3xl font-bold text-avon-dark mb-2">AVON</h1>
          <p className="text-avon-dark/60">لوحة إدارة المركز</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-avon-dark mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-avon-gold" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-avon-light border border-avon-beige rounded-xl focus:outline-none focus:border-avon-gold transition-all"
                placeholder="admin@avon.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-avon-dark mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-avon-gold" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-avon-light border border-avon-beige rounded-xl focus:outline-none focus:border-avon-gold transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gold py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-avon-dark/50">
          <p>نظام إدارة مركز AVON للطب التجميلي</p>
        </div>
      </div>
    </div>
  );
}


