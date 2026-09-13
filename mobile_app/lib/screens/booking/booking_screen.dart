import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

class BookingScreen extends StatefulWidget {
  final String serviceName;
  const BookingScreen({super.key, this.serviceName = ''});
  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _branches = [];
  List<Map<String, dynamic>> _doctors = [];
  Map<String, dynamic>? _service;
  Map<String, dynamic>? _branch;
  Map<String, dynamic>? _doctor;
  DateTime _date = DateTime.now();
  String? _time;
  Set<String> _taken = {};
  bool _loading = true;
  bool _submitting = false;
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();

  static const List<String> _slots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final c = Supabase.instance.client;
    final u = c.auth.currentUser;
    if (u != null) {
      try {
        final p = await c.from('profiles').select('phone').eq('id', u.id).maybeSingle();
        if (p != null && p['phone'] != null) _phoneCtrl.text = p['phone'].toString();
      } catch (_) {}
    }
    try { _services = List<Map<String, dynamic>>.from(await c.from('services').select().eq('is_active', true)); } catch (_) {}
    try { _branches = List<Map<String, dynamic>>.from(await c.from('branches').select().eq('is_active', true)); } catch (_) {}
    try { _doctors = List<Map<String, dynamic>>.from(await c.from('doctors').select().eq('is_active', true)); } catch (_) {}
    if (widget.serviceName.isNotEmpty) {
      for (final s in _services) {
        if ((s['name_ar'] ?? '').toString() == widget.serviceName) { _service = s; break; }
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  String get _iso => DateFormat('yyyy-MM-dd').format(_date);

  Future<void> _loadTaken() async {
    if (_branch == null || _doctor == null) { setState(() => _taken = {}); return; }
    try {
      final res = await Supabase.instance.client
          .from('appointments')
          .select('appointment_time')
          .eq('branch_id', _branch!['id'])
          .eq('doctor_name', (_doctor!['name'] ?? '').toString())
          .eq('appointment_date', _iso)
          .inFilter('status', ['pending', 'confirmed']);
      setState(() => _taken = {for (final r in res) (r['appointment_time'] ?? '').toString()});
    } catch (_) { setState(() => _taken = {}); }
  }

  void _msg(String t, [Color c = const Color(0xFFB76E79)]) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t, style: const TextStyle(fontFamily: 'Tajawal')), backgroundColor: c));
  }

  void _conflictDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [Icon(Icons.error, color: Color(0xFFC62828)), SizedBox(width: 8), Expanded(child: Text('الموعد غير متاح', style: TextStyle(fontFamily: 'Tajawal', fontSize: 16, fontWeight: FontWeight.w800)))]),
        content: const Text('هذا الموعد محجوز أو قيد المراجعة حالياً. الرجاء اختيار وقت آخر.', style: TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('حسناً', style: TextStyle(color: Color(0xFFB76E79), fontFamily: 'Tajawal')))],
      ),
    );
  }

  void _successDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [Icon(Icons.check_circle, color: Color(0xFF2E7D32)), SizedBox(width: 8), Expanded(child: Text('تم إرسال الحجز', style: TextStyle(fontFamily: 'Tajawal', fontSize: 16, fontWeight: FontWeight.w800)))]),
        content: const Text('تم إرسال حجزك للإدارة. سيصلك إشعار فوري عند الموافقة أو طلب تغيير الموعد.', style: TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
        actions: [TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); }, child: const Text('حسناً', style: TextStyle(color: Color(0xFFB76E79), fontFamily: 'Tajawal')))],
      ),
    );
  }

  Future<void> _submit() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) { _msg('الرجاء تسجيل الدخول أولاً', const Color(0xFFC62828)); return; }
    if (_service == null || _branch == null || _doctor == null || _time == null) { _msg('الرجاء إكمال جميع الاختيارات'); return; }
    if (_phoneCtrl.text.trim().isEmpty) { _msg('الرجاء إدخال رقم الهاتف'); return; }
    setState(() => _submitting = true);
    await _loadTaken();
    if (_taken.contains(_time)) { setState(() => _submitting = false); _conflictDialog(); return; }
    try {
      final inserted = await Supabase.instance.client.from('appointments').insert({
        'patient_id': user.id,
        'service_id': _service!['id'],
        'branch_id': _branch!['id'],
        'doctor_name': (_doctor!['name'] ?? '').toString(),
        'appointment_date': _iso,
        'appointment_time': _time,
        'status': 'pending',
        'total_price_iqd': (_service!['price_iqd'] ?? 0),
        'user_phone': _phoneCtrl.text.trim(),
        'user_notes': _notesCtrl.text.trim(),
      }).select('id').single();

      // حفظ رقم الهاتف في الملف الشخصي
      await Supabase.instance.client.from('profiles').upsert({'id': user.id, 'phone': _phoneCtrl.text.trim()});

      // إنشاء إشعار للأدمن
      try {
        final admins = await Supabase.instance.client.from('profiles').select('id').eq('is_admin', true);
        for (final admin in admins) {
          await Supabase.instance.client.from('notifications').insert({
            'user_id': admin['id'],
            'title': 'حجز جديد بانتظار الموافقة',
            'body': 'حجز جديد لـ ' + (_service!['name_ar'] ?? '').toString() + ' من ' + _phoneCtrl.text.trim(),
            'type': 'new_booking',
            'booking_id': inserted['id'],
          });
        }
      } catch (_) {}

      setState(() => _submitting = false);
      _successDialog();
    } catch (e) {
      setState(() => _submitting = false);
      _conflictDialog();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(backgroundColor: Color(0xFFF8F4F0), body: Center(child: CircularProgressIndicator(color: Color(0xFFB76E79))));
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFB76E79), size: 18), onPressed: () => Navigator.pop(context)),
        title: const Text('حجز موعد', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _dropdown('الخدمة', _services, (s) => (s['name_ar'] ?? '').toString(), _service, (v) { setState(() { _service = v; _time = null; }); }),
          const SizedBox(height: 14),
          _dropdown('الفرع', _branches, (s) => (s['name_ar'] ?? '').toString(), _branch, (v) { setState(() { _branch = v; _time = null; }); _loadTaken(); }),
          const SizedBox(height: 14),
          _dropdown('الطبيب', _doctors, (s) => (s['name'] ?? '').toString(), _doctor, (v) { setState(() { _doctor = v; _time = null; }); _loadTaken(); }),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              style: const TextStyle(fontFamily: 'Tajawal'),
              decoration: const InputDecoration(
                hintText: 'رقم الهاتف (مهم للتواصل)',
                hintStyle: TextStyle(fontFamily: 'Tajawal', color: Color(0xFFB76E79)),
                border: InputBorder.none,
                icon: Icon(Icons.phone, color: Color(0xFFB76E79)),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              IconButton(icon: const Icon(Icons.chevron_right, color: Color(0xFFB76E79)), onPressed: () { setState(() { _date = _date.subtract(const Duration(days: 1)); _time = null; }); _loadTaken(); }),
              Expanded(child: Center(child: Text(DateFormat('yyyy-MM-dd').format(_date), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'Tajawal')))),
              IconButton(icon: const Icon(Icons.chevron_left, color: Color(0xFFB76E79)), onPressed: () { setState(() { _date = _date.add(const Duration(days: 1)); _time = null; }); _loadTaken(); }),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8, runSpacing: 8,
            children: _slots.map((slot) {
              final taken = _taken.contains(slot);
              final selected = _time == slot;
              return ChoiceChip(
                label: Text(slot, style: TextStyle(fontFamily: 'Tajawal', color: taken ? Colors.grey : selected ? Colors.white : const Color(0xFF333333), decoration: taken ? TextDecoration.lineThrough : null)),
                selected: selected,
                disabledColor: Colors.grey.withOpacity(0.15),
                selectedColor: const Color(0xFFB76E79),
                backgroundColor: Colors.white,
                onSelected: taken ? null : (v) => setState(() => _time = slot),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: TextField(
              controller: _notesCtrl,
              maxLines: 4,
              style: const TextStyle(fontFamily: 'Tajawal'),
              decoration: const InputDecoration(
                hintText: 'ملاحظات إضافية (اختياري)',
                hintStyle: TextStyle(fontFamily: 'Tajawal', color: Color(0xFFB76E79)),
                border: InputBorder.none,
                icon: Icon(Icons.notes, color: Color(0xFFB76E79)),
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('إرسال الحجز', style: TextStyle(fontFamily: 'Tajawal', fontSize: 16, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _dropdown(String label, List<Map<String, dynamic>> items, String Function(Map<String, dynamic>) text, Map<String, dynamic>? value, ValueChanged<Map<String, dynamic>> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Map<String, dynamic>>(
          isExpanded: true,
          hint: Text(label, style: const TextStyle(fontFamily: 'Tajawal', color: Color(0xFFB76E79))),
          value: value,
          items: items.map((s) => DropdownMenuItem(value: s, child: Text(text(s), style: const TextStyle(fontFamily: 'Tajawal')))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
        ),
      ),
    );
  }
}