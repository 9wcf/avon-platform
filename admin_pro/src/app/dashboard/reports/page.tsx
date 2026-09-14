"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Button } from "@/components/ui";
import { formatIQD } from "@/lib/utils";
import { RequireRole } from "@/lib/auth";
import { motion } from "framer-motion";
import { BarChart3, Download, Calendar, DollarSign, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, confirmed: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: d } = await supabase.from("appointments")
      .select("*, services:service_id(name_ar), branches:branch_id(name_ar), profiles:patient_id(full_name, email)")
      .gte("appointment_date", from).lte("appointment_date", to).order("appointment_date", { ascending: false });
    const rows = d || [];
    setData(rows);
    const confirmed = rows.filter(r => r.status === "confirmed" || r.status === "completed");
    setStats({ total: rows.length, revenue: confirmed.reduce((s, r) => s + Number(r.total_price_iqd || 0), 0), confirmed: confirmed.length });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AVON - Financial Report", 105, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text("From " + from + " to " + to, 105, 23, { align: "center" });
    doc.text("Confirmed Revenue: " + stats.revenue.toLocaleString() + " IQD", 105, 30, { align: "center" });
    autoTable(doc, {
      startY: 38,
      head: [["Date", "Time", "Customer", "Service", "Branch", "Price", "Status"]],
      body: data.map(r => [r.appointment_date, r.appointment_time, r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "-", r.services?.name_ar || "-", r.branches?.name_ar || "-", Number(r.total_price_iqd || 0).toLocaleString(), r.status]),
      styles: { halign: "center" },
      headStyles: { fillColor: [183, 110, 121] },
    });
    doc.save("AVON-Report-" + from + "-to-" + to + ".pdf");
  };

  const exportExcel = () => {
    const rows = data.map(r => ({ "Date": r.appointment_date, "Time": r.appointment_time, "Customer": r.profiles?.full_name || r.profiles?.email || "-", "Service": r.services?.name_ar || "-", "Branch": r.branches?.name_ar || "-", "Price IQD": Number(r.total_price_iqd || 0), "Status": r.status }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "AVON-Report-" + from + "-to-" + to + ".xlsx");
  };

  return (
    <RequireRole roles={["admin"]}>
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#D4AF37,#B76E79)" }}><BarChart3 className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-extrabold text-gradient-gold">التقارير المالية</h2><p className="text-sm text-gray-500">بالدينار العراقي • تصدير PDF / Excel</p></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#B76E79]" /><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="p-2 rounded-lg border border-gray-200 text-sm" /></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#B76E79]" /><input type="date" value={to} onChange={e => setTo(e.target.value)} className="p-2 rounded-lg border border-gray-200 text-sm" /></div>
            <Button onClick={load} variant="secondary" className="!py-2">تحديث</Button>
            <div className="flex gap-2">
              <button onClick={exportPDF} className="p-2 bg-red-50 rounded-lg hover:bg-red-100"><Download className="w-4 h-4 text-red-500" /></button>
              <button onClick={exportExcel} className="p-2 bg-green-50 rounded-lg hover:bg-green-100"><Download className="w-4 h-4 text-green-600" /></button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat icon={TrendingUp} label="إجمالي الحجوزات" value={stats.total.toString()} color="#D4AF37" />
            <Stat icon={DollarSign} label="الإيرادات المؤكدة" value={formatIQD(stats.revenue)} color="#B76E79" />
            <Stat icon={BarChart3} label="حجوزات مؤكدة" value={stats.confirmed.toString()} color="#2E7D32" />
          </div>
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-gray-500">
                <th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">الزبون</th><th className="p-3 text-right">الخدمة</th><th className="p-3 text-right">الفرع</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">الحالة</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">جاري التحميل...</td></tr> :
                  data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد بيانات بهذه الفترة</td></tr> :
                    data.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="p-3">{r.appointment_date} {r.appointment_time}</td>
                        <td className="p-3 font-semibold">{r.profiles?.full_name || r.profiles?.email?.split("@")[0]}</td>
                        <td className="p-3">{r.services?.name_ar}</td>
                        <td className="p-3">{r.branches?.name_ar}</td>
                        <td className="p-3 font-bold text-[#B76E79]">{formatIQD(r.total_price_iqd)}</td>
                        <td className="p-3"><span className={"px-2 py-1 rounded-full text-xs font-bold " + (r.status === "confirmed" ? "bg-green-100 text-green-700" : r.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600")}>{r.status}</span></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (<div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center"><Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} /><p className="text-xl font-extrabold" style={{ color }}>{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>);
}
