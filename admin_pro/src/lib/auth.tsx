"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export type Role = "admin" | "staff" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data?.is_admin || data?.role === "admin") setRole("admin");
        else setRole("staff");
      }
      setLoading(false);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data?.is_admin || data?.role === "admin") setRole("admin");
        else setRole("staff");
      } else {
        setRole(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? "الإيميل أو كلمة السر غير صحيحة" : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut, isAdmin: role === "admin", isStaff: role === "staff" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// مكون حماية الصفحات حسب الصلاحية
export function RequireRole({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const { role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" /></div>;
  if (!role || !roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-[#B76E79]">ليس لديك صلاحية الوصول</h2>
        <p className="text-gray-500">هذه الصفحة متاحة للمدير فقط</p>
      </div>
    );
  }
  return <>{children}</>;
}
