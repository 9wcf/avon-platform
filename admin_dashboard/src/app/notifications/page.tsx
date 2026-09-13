"use client";

import { useState } from "react";
import { Bell, Send, Users, CheckCircle, Clock, XCircle } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: "حجز جديد", message: "تم حجز موعد جديد من عميلة", time: "منذ 5 دقائق", read: false, type: "info" },
    { id: 2, title: "تأكيد حجز", message: "تم تأكيد حجز موعد الغد", time: "منذ ساعة", read: true, type: "success" },
    { id: 3, title: "إلغاء حجز", message: "تم إلغاء حجز موعد", time: "منذ 3 ساعات", read: true, type: "warning" },
  ]);
  const [showCompose, setShowCompose] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "", recipients: "all" });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotification = {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      time: "الآن",
      read: false,
      type: "info",
    };
    setNotifications([newNotification, ...notifications]);
    setFormData({ title: "", message: "", recipients: "all" });
    setShowCompose(false);
    alert("تم إرسال الإشعار بنجاح");
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإشعارات</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-avon-gold to-avon-gold/80 text-white rounded-2xl shadow-lg hover:scale-105 transition-all font-semibold">
          <Send className="w-5 h-5" />
          <span>إرسال إشعار</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي الإشعارات" value={notifications.length} icon={Bell} gradient="from-blue-500 to-blue-600" />
        <StatCard title="غير مقروءة" value={unreadCount} icon={Clock} gradient="from-yellow-500 to-yellow-600" />
        <StatCard title="مقروءة" value={notifications.length - unreadCount} icon={CheckCircle} gradient="from-green-500 to-green-600" />
      </div>

      <div className="luxury-card bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-6">جميع الإشعارات</h2>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className={`flex items-start gap-4 p-4 rounded-xl transition-all ${notification.read ? 'bg-gray-50' : 'bg-avon-gold/5 border-r-4 border-avon-gold'}`}>
                <div className={`p-2 rounded-lg ${notification.type === 'success' ? 'bg-green-100' : notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : notification.type === 'warning' ? <XCircle className="w-5 h-5 text-yellow-600" /> : <Bell className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="قراءة">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notification.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">إرسال إشعار جديد</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-gray-100 rounded-xl"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">العنوان</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">الرسالة</label>
                <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50" rows={4} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">المستلمون</label>
                <select value={formData.recipients} onChange={(e) => setFormData({...formData, recipients: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-avon-gold/50">
                  <option value="all">جميع العملاء</option>
                  <option value="active">العملاء النشطون</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCompose(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-avon-gold to-avon-gold/80 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold"><Send className="w-5 h-5" /><span>إرسال</span></button>
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
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
      <div className="relative luxury-card bg-white group-hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-600 mb-1">{title}</p><h4 className="text-2xl font-bold">{value}</h4></div>
          <div className={`p-3 bg-gradient-to-r ${gradient} rounded-2xl shadow-lg`}><Icon className="w-6 h-6 text-white" /></div>
        </div>
      </div>
    </div>
  );
}
