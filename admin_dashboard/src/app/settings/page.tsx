"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Palette, Globe, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "AVON Center",
    siteDescription: "مركز AVON للطب التجميلي والعناية",
    email: "admin@avon.com",
    phone: "0770 123 4567",
    address: "بغداد، العراق",
    workingHours: "09:00 ص - 10:00 م",
    currency: "IQD",
    language: "ar",
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", name: "عام", icon: Settings },
    { id: "notifications", name: "الإشعارات", icon: Bell },
    { id: "security", name: "الأمان", icon: Shield },
    { id: "appearance", name: "المظهر", icon: Palette },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإعدادات</h1>
          <p className="text-gray-600">تخصيص إعدادات النظام</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">تم الحفظ بنجاح</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="luxury-card bg-white p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-l from-avon-gold to-avon-gold/80 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-semibold">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <div className="luxury-card bg-white p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">الإعدادات العامة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الموقع</label>
                  <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                  <input type="tel" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">العملة</label>
                  <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50">
                    <option value="IQD">دينار عراقي (د.ع)</option>
                    <option value="USD">دولار أمريكي ($)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                  <textarea value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان</label>
                  <input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ساعات العمل</label>
                  <input type="text" value={settings.workingHours} onChange={(e) => setSettings({...settings, workingHours: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" />
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-avon-gold/80 text-white rounded-xl shadow-lg hover:scale-105 transition-all font-semibold">
                <Save className="w-5 h-5" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="luxury-card bg-white p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">إعدادات الإشعارات</h2>
              <div className="space-y-4">
                {[
                  { key: "email", label: "إشعارات البريد الإلكتروني", desc: "استلام إشعارات عبر البريد" },
                  { key: "sms", label: "إشعارات SMS", desc: "استلام رسائل نصية" },
                  { key: "push", label: "الإشعارات الفورية", desc: "إشعارات داخل التطبيق" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifications[item.key as keyof typeof settings.notifications]} onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, [item.key]: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-avon-gold"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-avon-gold/80 text-white rounded-xl shadow-lg hover:scale-105 transition-all font-semibold">
                <Save className="w-5 h-5" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="luxury-card bg-white p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">إعدادات الأمان</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">تغيير كلمة المرور</h3>
                  <p className="text-sm text-gray-500 mb-4">قم بتحديث كلمة المرور بشكل دوري</p>
                  <button className="px-4 py-2 bg-avon-gold text-white rounded-lg hover:bg-avon-gold/80 transition-all">تغيير كلمة المرور</button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">المصادقة الثنائية (2FA)</h3>
                  <p className="text-sm text-gray-500 mb-4">طبقة أمان إضافية لحسابك</p>
                  <button className="px-4 py-2 border-2 border-avon-gold text-avon-gold rounded-lg hover:bg-avon-gold/10 transition-all">تفعيل 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="luxury-card bg-white p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">إعدادات المظهر</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اللغة</label>
                  <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">الوضع الليلي</h3>
                  <p className="text-sm text-gray-500 mb-4">قريباً</p>
                  <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">غير متاح حالياً</button>
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-avon-gold/80 text-white rounded-xl shadow-lg hover:scale-105 transition-all font-semibold">
                <Save className="w-5 h-5" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
