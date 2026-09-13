import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'booking/booking_details_screen.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});
  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<Map<String, dynamic>> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() => _loading = false);
        return;
      }
      final res = await Supabase.instance.client
          .from('appointments')
          .select('*, services:service_id(name_ar), branches:branch_id(name_ar)')
          .eq('patient_id', user.id)
          .inFilter('status', ['pending', 'confirmed'])
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _list = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
      }
    } catch (e) {
      print('Error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('حجوزاتي', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : _list.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event_busy, size: 70, color: Color(0xFFE8B4B8)),
                      SizedBox(height: 12),
                      Text('لا توجد حجوزات قادمة', style: TextStyle(fontSize: 16, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _list.length,
                  itemBuilder: (context, index) {
                    final a = _list[index];
                    final svc = (a['services'] != null ? a['services']['name_ar'] : null) ?? 'خدمة';
                    final br = (a['branches'] != null ? a['branches']['name_ar'] : null) ?? '';
                    final status = a['status'] ?? 'pending';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.12), blurRadius: 12, offset: const Offset(0, 5))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                child: const Icon(Icons.spa, color: Color(0xFFB76E79), size: 22),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(svc, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                                    if (br.isNotEmpty) Text(br, style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                                  ],
                                ),
                              ),
                              _statusChip(status),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 14, color: Color(0xFFB76E79)),
                              const SizedBox(width: 6),
                              Text((a['appointment_date'] ?? '').toString(), style: const TextStyle(fontSize: 12, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                              const SizedBox(width: 16),
                              const Icon(Icons.access_time, size: 14, color: Color(0xFFB76E79)),
                              const SizedBox(width: 6),
                              Text((a['appointment_time'] ?? '').toString(), style: const TextStyle(fontSize: 12, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  Widget _statusChip(String status) {
    Color c = status == 'confirmed' ? const Color(0xFF2E7D32) : const Color(0xFFF9A825);
    String t = status == 'confirmed' ? 'مؤكد' : 'قيد الانتظار';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: c.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
      child: Text(t, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: c, fontFamily: 'Tajawal')),
    );
  }
}

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});
  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> {
  List<Map<String, dynamic>> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() => _loading = false);
        return;
      }
      final res = await Supabase.instance.client
          .from('appointments')
          .select('*, services:service_id(name_ar)')
          .eq('patient_id', user.id)
          .inFilter('status', ['completed', 'cancelled'])
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _list = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('سجل الحجوزات', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : _list.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history, size: 70, color: Color(0xFFE8B4B8)),
                      SizedBox(height: 12),
                      Text('لا يوجد سجل حجوزات', style: TextStyle(fontSize: 16, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _list.length,
                  itemBuilder: (context, index) {
                    final a = _list[index];
                    final svc = (a['services'] != null ? a['services']['name_ar'] : null) ?? 'خدمة';
                    final status = a['status'] ?? '';
                    final done = status == 'completed';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.white),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(9),
                            decoration: BoxDecoration(
                              color: (done ? const Color(0xFF2E7D32) : const Color(0xFFC62828)).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              done ? Icons.check_circle : Icons.cancel,
                              color: done ? const Color(0xFF2E7D32) : const Color(0xFFC62828),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(svc, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                                Text((a['appointment_date'] ?? '').toString(), style: TextStyle(fontSize: 11, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                              ],
                            ),
                          ),
                          Text(
                            done ? 'مكتمل' : 'ملغى',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: done ? const Color(0xFF2E7D32) : const Color(0xFFC62828), fontFamily: 'Tajawal'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() => _loading = false);
        return;
      }
      final res = await Supabase.instance.client
          .from('appointments')
          .select('*, services:service_id(name_ar)')
          .eq('patient_id', user.id)
          .order('created_at', ascending: false)
          .limit(20);
      if (mounted) {
        setState(() {
          _list = List<Map<String, dynamic>>.from(res);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('الإشعارات', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : _list.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 70, color: Color(0xFFE8B4B8)),
                      SizedBox(height: 12),
                      Text('لا توجد إشعارات', style: TextStyle(fontSize: 16, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _list.length,
                  itemBuilder: (context, index) {
                    final a = _list[index];
                    final svc = (a['services'] != null ? a['services']['name_ar'] : null) ?? 'خدمة';
                    final status = a['status'] ?? '';
                    String title = 'حجز جديد';
                    String body = 'تم استلام حجزك: ' + svc;
                    IconData ic = Icons.event_note;
                    if (status == 'confirmed') {
                      title = 'تم تأكيد حجزك';
                      body = 'حجزك لـ ' + svc + ' مؤكد';
                      ic = Icons.check_circle;
                    }
                    if (status == 'completed') {
                      title = 'اكتمل حجزك';
                      body = 'شكراً لزيارتك - ' + svc;
                      ic = Icons.task_alt;
                    }
                    if (status == 'cancelled') {
                      title = 'تم إلغاء حجزك';
                      body = 'حجزك لـ ' + svc + ' ملغى';
                      ic = Icons.cancel;
                    }
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: Icon(ic, color: const Color(0xFFB76E79), size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                                const SizedBox(height: 3),
                                Text(body, style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notif = true;
  bool _email = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('الإعدادات', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _toggle('الإشعارات الفورية', 'استلام إشعارات عند تحديث حجزك', _notif, (v) => setState(() => _notif = v)),
          const SizedBox(height: 12),
          _toggle('إشعارات البريد', 'استلام تحديثات عبر البريد', _email, (v) => setState(() => _email = v)),
          const SizedBox(height: 20),
          _info('اللغة', 'العربية'),
          const SizedBox(height: 12),
          _info('الإصدار', '1.0.0'),
          const SizedBox(height: 12),
          _info('تواصل معنا', '0770 000 0000'),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xFFB76E79).withOpacity(0.1), const Color(0xFFE8B4B8).withOpacity(0.1)]),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFB76E79).withOpacity(0.2)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('عن مركز AVON', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                SizedBox(height: 8),
                Text('مركز AVON للطب التجميلي والعناية بالبشرة، نقدم أحدث التقنيات بأيدي نخبة من الأطباء.', style: TextStyle(fontSize: 13, color: Color(0xFF333333), fontFamily: 'Tajawal', height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _toggle(String title, String sub, bool value, ValueChanged<bool> onChanged) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                const SizedBox(height: 3),
                Text(sub, style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged, activeColor: const Color(0xFFB76E79)),
        ],
      ),
    );
  }

  Widget _info(String title, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal'))),
          Text(value, style: const TextStyle(fontSize: 14, color: Color(0xFFB76E79), fontWeight: FontWeight.w700, fontFamily: 'Tajawal')),
        ],
      ),
    );
  }
}

class SearchScreen extends StatefulWidget {
  final String initialQuery;
  const SearchScreen({super.key, this.initialQuery = ''});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _ctrl = TextEditingController();
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> _offers = [];
  String _q = '';

  @override
  void initState() {
    super.initState();
    _ctrl.text = widget.initialQuery;
    _q = widget.initialQuery.toLowerCase();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final c = Supabase.instance.client;
    try {
      _services = List<Map<String, dynamic>>.from(await c.from('services').select().eq('is_active', true));
    } catch (_) {}
    try {
      _doctors = List<Map<String, dynamic>>.from(await c.from('doctors').select().eq('is_active', true));
    } catch (_) {}
    try {
      _offers = List<Map<String, dynamic>>.from(await c.from('offers').select().eq('is_active', true));
    } catch (_) {}
    if (mounted) setState(() {});
  }

  bool _hit(String s) => s.toLowerCase().contains(_q);

  @override
  Widget build(BuildContext context) {
    final svc = _q.isEmpty ? _services : _services.where((s) => _hit((s['name_ar'] ?? '').toString())).toList();
    final doc = _q.isEmpty ? _doctors : _doctors.where((s) => _hit((s['name'] ?? '').toString()) || _hit((s['specialty'] ?? '').toString())).toList();
    final off = _q.isEmpty ? _offers : _offers.where((s) => _hit((s['title_ar'] ?? '').toString())).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('البحث', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: TextField(
              controller: _ctrl,
              autofocus: true,
              onChanged: (v) => setState(() => _q = v.toLowerCase()),
              style: const TextStyle(fontFamily: 'Tajawal'),
              decoration: InputDecoration(
                hintText: 'ابحثي عن خدمة، طبيب، عرض...',
                hintStyle: TextStyle(color: const Color(0xFF333333).withOpacity(0.4), fontFamily: 'Tajawal'),
                prefixIcon: const Icon(Icons.search, color: Color(0xFFB76E79)),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (svc.isNotEmpty) ...[_label('خدمات'), ...svc.map((s) => _row(Icons.spa, (s['name_ar'] ?? '').toString(), () {}))],
                if (doc.isNotEmpty) ...[_label('أطباء'), ...doc.map((s) => _row(Icons.medical_services, (s['name'] ?? '').toString(), () {}))],
                if (off.isNotEmpty) ...[_label('عروض'), ...off.map((s) => _row(Icons.local_offer, (s['title_ar'] ?? '').toString(), () {}))],
                if (svc.isEmpty && doc.isEmpty && off.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: Text('لا توجد نتائج', style: TextStyle(fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 8),
        child: Text(t, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
      );

  Widget _row(IconData ic, String title, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
          child: Row(
            children: [
              Icon(ic, color: const Color(0xFFB76E79), size: 22),
              const SizedBox(width: 12),
              Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal'))),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFFB76E79)),
            ],
          ),
        ),
      ),
    );
  }
}