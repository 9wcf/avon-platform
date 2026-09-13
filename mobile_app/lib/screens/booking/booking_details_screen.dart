import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:async';

class BookingDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> booking;
  const BookingDetailsScreen({super.key, required this.booking});
  @override
  State<BookingDetailsScreen> createState() => _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends State<BookingDetailsScreen> {
  List<Map<String, dynamic>> _messages = [];
  RealtimeChannel? _channel;
  Map<String, dynamic>? _current;
  final TextEditingController _msgCtrl = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _current = widget.booking;
    _loadMessages();
    _subscribeBooking();
    _subscribeMessages();
  }

  void _subscribeBooking() {
    _channel?.unsubscribe();
    _channel = Supabase.instance.client
        .channel('booking_${_current!['id']}')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'id', value: _current!['id']),
          callback: (payload) {
            if (mounted) setState(() => _current = Map<String, dynamic>.from(payload.newRecord));
          },
        )
        .subscribe();
  }

  void _subscribeMessages() {
    Supabase.instance.client
        .channel('msgs_${_current!['id']}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'booking_messages',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'booking_id', value: _current!['id']),
          callback: (payload) {
            if (mounted) _loadMessages();
          },
        )
        .subscribe();
  }

  Future<void> _loadMessages() async {
    try {
      final res = await Supabase.instance.client
          .from('booking_messages')
          .select('*')
          .eq('booking_id', _current!['id'])
          .order('created_at', ascending: true);
      if (mounted) setState(() => _messages = List<Map<String, dynamic>>.from(res));
    } catch (_) {}
  }

  Future<void> _sendMsg() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    final u = Supabase.instance.client.auth.currentUser;
    try {
      await Supabase.instance.client.from('booking_messages').insert({
        'booking_id': _current!['id'],
        'sender_type': 'user',
        'sender_name': u?.email?.split('@').first ?? 'أنا',
        'message': text,
      });
      _msgCtrl.clear();
      await _loadMessages();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل الإرسال: $e', style: const TextStyle(fontFamily: 'Tajawal'))));
    }
    if (mounted) setState(() => _sending = false);
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    _msgCtrl.dispose();
    super.dispose();
  }

  String _statusText(String s) {
    switch (s) {
      case 'pending': return 'قيد المراجعة';
      case 'confirmed': return 'مؤكد ✓';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return s;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'pending': return const Color(0xFFF9A825);
      case 'confirmed': return const Color(0xFF2E7D32);
      case 'completed': return const Color(0xFF1976D2);
      case 'cancelled': return const Color(0xFFC62828);
      default: return const Color(0xFFB76E79);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = _current!;
    final status = (b['status'] ?? 'pending').toString();
    final svc = (b['services'] != null ? b['services']['name_ar'] : null) ?? b['service_name'] ?? 'خدمة';
    final br = (b['branches'] != null ? b['branches']['name_ar'] : null) ?? b['branch_name'] ?? '';
    final adminNote = (b['admin_notes'] ?? '').toString();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18), onPressed: () => Navigator.pop(context)),
        title: const Text('تفاصيل الحجز', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [const Color(0xFFB76E79), const Color(0xFFE8B4B8)]),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.spa, color: Colors.white, size: 28),
                        const SizedBox(width: 10),
                        Expanded(child: Text(svc, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal'))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                          child: Text(_statusText(status), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: _statusColor(status), fontFamily: 'Tajawal')),
                        ),
                      ]),
                      const SizedBox(height: 14),
                      _infoRow(Icons.calendar_today, 'التاريخ', (b['appointment_date'] ?? '').toString()),
                      _infoRow(Icons.access_time, 'الوقت', (b['appointment_time'] ?? '').toString()),
                      _infoRow(Icons.location_on, 'الفرع', br),
                      _infoRow(Icons.person, 'الطبيب', (b['doctor_name'] ?? '').toString()),
                      _infoRow(Icons.attach_money, 'السعر', (b['total_price_iqd'] ?? 0).toString() + ' د.ع'),
                    ],
                  ),
                ),
                if ((b['user_notes'] ?? '').toString().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFB76E79).withOpacity(0.3))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Row(children: [Icon(Icons.notes, color: Color(0xFFB76E79), size: 18), SizedBox(width: 6), Text('ملاحظاتي', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal'))]),
                      const SizedBox(height: 6),
                      Text(b['user_notes'].toString(), style: const TextStyle(fontSize: 13, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ]),
                  ),
                ],
                if (adminNote.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF2E7D32).withOpacity(0.4))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Row(children: [Icon(Icons.reply, color: Color(0xFF2E7D32), size: 18), SizedBox(width: 6), Text('رد الإدارة', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF2E7D32), fontFamily: 'Tajawal'))]),
                      const SizedBox(height: 6),
                      Text(adminNote, style: const TextStyle(fontSize: 13, fontFamily: 'Tajawal', color: Color(0xFF333333))),
                    ]),
                  ),
                ],
                const SizedBox(height: 16),
                const Padding(padding: EdgeInsets.only(bottom: 8), child: Text('المحادثة مع الإدارة', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'))),
                if (_messages.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: const Center(child: Text('لا توجد رسائل بعد. ابدأ المحادثة بإرسال رسالة أدناه.', style: TextStyle(fontFamily: 'Tajawal', color: Color(0xFF666666)))),
                  )
                else
                  ..._messages.map((m) => _messageBubble(m)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))]),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(color: const Color(0xFFF8F4F0), borderRadius: BorderRadius.circular(24)),
                      child: TextField(
                        controller: _msgCtrl,
                        style: const TextStyle(fontFamily: 'Tajawal'),
                        decoration: const InputDecoration(
                          hintText: 'اكتب رسالتك...',
                          hintStyle: TextStyle(fontFamily: 'Tajawal'),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFB76E79), Color(0xFFD4909C)]), shape: BoxShape.circle),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white),
                      onPressed: _sending ? null : _sendMsg,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData ic, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Icon(ic, color: Colors.white, size: 16),
        const SizedBox(width: 8),
        Text(label + ': ', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.9), fontFamily: 'Tajawal')),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, fontFamily: 'Tajawal')),
      ]),
    );
  }

  Widget _messageBubble(Map<String, dynamic> m) {
    final isUser = m['sender_type'] == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32, height: 32,
              decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFB76E79), Color(0xFFD4909C)]), shape: BoxShape.circle),
              child: const Icon(Icons.business, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser ? const Color(0xFFB76E79) : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isUser) Text((m['sender_name'] ?? 'الإدارة').toString(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
                  Text(m['message'].toString(), style: TextStyle(fontSize: 13, color: isUser ? Colors.white : const Color(0xFF333333), fontFamily: 'Tajawal')),
                  const SizedBox(height: 4),
                  Text((m['created_at'] ?? '').toString().substring(11, 16), style: TextStyle(fontSize: 10, color: isUser ? Colors.white.withOpacity(0.7) : Colors.grey, fontFamily: 'Tajawal')),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 32, height: 32,
              decoration: const BoxDecoration(color: Color(0xFFE8B4B8), shape: BoxShape.circle),
              child: const Icon(Icons.person, color: Colors.white, size: 16),
            ),
          ],
        ],
      ),
    );
  }
}