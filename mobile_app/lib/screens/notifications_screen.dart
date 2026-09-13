import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AppNotificationsScreen extends StatefulWidget {
  const AppNotificationsScreen({super.key});
  @override
  State<AppNotificationsScreen> createState() => _AppNotificationsScreenState();
}

class _AppNotificationsScreenState extends State<AppNotificationsScreen> {
  List<Map<String, dynamic>> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final u = Supabase.instance.client.auth.currentUser;
    if (u == null) { setState(() => _loading = false); return; }
    try {
      final res = await Supabase.instance.client
          .from('notifications')
          .select('*')
          .eq('user_id', u.id)
          .order('created_at', ascending: false);
      if (mounted) setState(() { _list = List<Map<String, dynamic>>.from(res); _loading = false; });
      await Supabase.instance.client
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', u.id)
          .eq('is_read', false);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _color(String t) {
    if (t == 'approved') return const Color(0xFF2E7D32);
    if (t == 'rejected') return const Color(0xFFC62828);
    if (t == 'admin_message') return const Color(0xFF1976D2);
    if (t == 'new_booking') return const Color(0xFFD4AF37);
    return const Color(0xFFB76E79);
  }

  IconData _icon(String t) {
    if (t == 'approved') return Icons.check_circle;
    if (t == 'rejected') return Icons.error;
    if (t == 'admin_message') return Icons.chat;
    if (t == 'new_booking') return Icons.event;
    return Icons.notifications;
  }

  String _time(dynamic v) {
    final s = (v ?? '').toString();
    if (s.length < 16) return s;
    return s.replaceAll('T', ' ').substring(0, 16);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18), onPressed: () => Navigator.pop(context)),
        title: const Text('الإشعارات', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : _list.isEmpty
              ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.notifications_none, size: 70, color: Color(0xFFE8B4B8)), SizedBox(height: 12), Text('لا توجد إشعارات', style: TextStyle(fontSize: 16, fontFamily: 'Tajawal', color: Color(0xFF333333)))]))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _list.length,
                  itemBuilder: (context, index) {
                    final n = _list[index];
                    final t = (n['type'] ?? 'info').toString();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 3))]),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(padding: const EdgeInsets.all(9), decoration: BoxDecoration(color: _color(t).withOpacity(0.12), borderRadius: BorderRadius.circular(12)), child: Icon(_icon(t), color: _color(t), size: 20)),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text((n['title'] ?? '').toString(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                            const SizedBox(height: 4),
                            Text((n['body'] ?? '').toString(), style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.7), fontFamily: 'Tajawal')),
                            const SizedBox(height: 4),
                            Text(_time(n['created_at']), style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontFamily: 'Tajawal')),
                          ])),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
