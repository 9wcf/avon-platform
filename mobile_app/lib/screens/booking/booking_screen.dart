import 'package:flutter/material.dart';
import '../login_screen.dart';
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
  
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTime;
  Set<String> _bookedSlots = {};
  bool _loading = true;
  bool _submitting = false;
  
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();

  static const int _startHour = 9;
  static const int _endHour = 22;
  static const int _slotMinutes = 30;

  List<String> get _timeSlots {
    final slots = <String>[];
    for (int h = _startHour; h < _endHour; h++) {
      slots.add('${h.toString().padLeft(2, '0')}:00');
      slots.add('${h.toString().padLeft(2, '0')}:30');
    }
    return slots;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
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

  String get _dateStr => DateFormat('yyyy-MM-dd').format(_selectedDate);

  Future<void> _loadBookedSlots() async {
    if (_branch == null || _doctor == null) {
      setState(() => _bookedSlots = {});
      return;
    }
    try {
      final res = await Supabase.instance.client
          .from('appointments')
          .select('appointment_time')
          .eq('branch_id', _branch!['id'])
          .eq('doctor_name', (_doctor!['name'] ?? '').toString())
          .eq('appointment_date', _dateStr)
          .inFilter('status', ['pending', 'confirmed']);
      setState(() => _bookedSlots = {for (final r in res) (r['appointment_time'] ?? '').toString()});
    } catch (_) {
      setState(() => _bookedSlots = {});
    }
  }

  bool _isPastSlot(String time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final selDay = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
    
    if (selDay.isAfter(today)) return false;
    
    final parts = time.split(':');
    final slotTime = DateTime(now.year, now.month, now.day, int.parse(parts[0]), int.parse(parts[1]));
    return slotTime.isBefore(now);
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
        content: const Text('هذا الموعد محجوز أو فات وقته. الرجاء اختيار وقت آخر.', style: TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
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

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: Color(0xFFB76E79), onPrimary: Colors.white),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _selectedTime = null;
      });
      _loadBookedSlots();
    }
  }

  Future<void> _submit() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) { _msg('الرجاء تسجيل الدخول أولاً', const Color(0xFFC62828)); return; }
    if (_service == null || _branch == null || _doctor == null || _selectedTime == null) { _msg('الرجاء إكمال جميع الاختيارات'); return; }
    if (_phoneCtrl.text.trim().isEmpty) { _msg('الرجاء إدخال رقم الهاتف'); return; }
    
    setState(() => _submitting = true);
    await _loadBookedSlots();
    
    if (_bookedSlots.contains(_selectedTime) || _isPastSlot(_selectedTime!)) {
      setState(() => _submitting = false);
      _conflictDialog();
      return;
    }
    
    try {
      await Supabase.instance.client.from('appointments').insert({
        'patient_id': user.id,
        'service_id': _service!['id'],
        'branch_id': _branch!['id'],
        'doctor_name': (_doctor!['name'] ?? '').toString(),
        'appointment_date': _dateStr,
        'appointment_time': _selectedTime,
        'status': 'pending',
        'total_price_iqd': (_service!['price_iqd'] ?? 0),
        'user_phone': _phoneCtrl.text.trim(),
        'user_notes': _notesCtrl.text.trim(),
      });

      await Supabase.instance.client.from('profiles').upsert({'id': user.id, 'phone': _phoneCtrl.text.trim()});

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
        // ✅ التعديل هنا: زيادة المسافة من الأسفل لضمان ظهور زر الإرسال فوق الشريط الأسود
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
        children: [
          _dropdown('الخدمة', _services, (s) => (s['name_ar'] ?? '').toString(), _service, (v) { setState(() { _service = v; _selectedTime = null; }); }),
          const SizedBox(height: 14),
          _dropdown('الفرع', _branches, (s) => (s['name_ar'] ?? '').toString(), _branch, (v) { setState(() { _branch = v; _selectedTime = null; }); _loadBookedSlots(); }),
          const SizedBox(height: 14),
          _dropdown('الطبيب', _doctors, (s) => (s['name'] ?? '').toString(), _doctor, (v) { setState(() { _doctor = v; _selectedTime = null; }); _loadBookedSlots(); }),
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
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xFFB76E79).withOpacity(0.1), const Color(0xFFE8B4B8).withOpacity(0.1)]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFB76E79).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(children: [Icon(Icons.calendar_today, color: Color(0xFFB76E79), size: 20), SizedBox(width: 8), Text('اختر التاريخ', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'))]),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: _pickDate,
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      const Icon(Icons.event, color: Color(0xFFB76E79), size: 22),
                      const SizedBox(width: 12),
                      Expanded(child: Text(DateFormat('EEEE d MMMM yyyy', 'ar').format(_selectedDate), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal'))),
                      const Icon(Icons.edit_calendar, color: Color(0xFFB76E79), size: 20),
                    ]),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xFFD4AF37).withOpacity(0.1), const Color(0xFFE8C766).withOpacity(0.1)]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.access_time, color: Color(0xFFD4AF37), size: 20),
                  const SizedBox(width: 8),
                  const Text('اختر الوقت', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  const Spacer(),
                  Text('من $_startHour:00 ص إلى ${_endHour - 12}:00 م', style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontFamily: 'Tajawal')),
                ]),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: _timeSlots.map((slot) {
                    final booked = _bookedSlots.contains(slot);
                    final past = _isPastSlot(slot);
                    final disabled = booked || past;
                    final selected = _selectedTime == slot;
                    
                    return ChoiceChip(
                      label: Text(slot, style: TextStyle(
                        fontFamily: 'Tajawal',
                        color: disabled ? Colors.grey : selected ? Colors.white : const Color(0xFF333333),
                        decoration: booked ? TextDecoration.lineThrough : null,
                      )),
                      selected: selected,
                      disabledColor: Colors.grey.withOpacity(0.15),
                      selectedColor: const Color(0xFFD4AF37),
                      backgroundColor: Colors.white,
                      side: BorderSide(color: selected ? const Color(0xFFD4AF37) : Colors.grey.shade300),
                      onSelected: disabled ? null : (v) => setState(() => _selectedTime = slot),
                    );
                  }).toList(),
                ),
                if (_bookedSlots.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Row(children: [
                    Container(width: 12, height: 12, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(3))),
                    const SizedBox(width: 6),
                    Text('محجوز', style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontFamily: 'Tajawal')),
                    const SizedBox(width: 12),
                    Container(width: 12, height: 12, decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(3))),
                    const SizedBox(width: 6),
                    Text('مختار', style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontFamily: 'Tajawal')),
                  ]),
                ],
              ],
            ),
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
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFB76E79),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
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

  void _requireAuth() {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      });
    }
  }
}