import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:ui';

class BookingScreen extends StatefulWidget {
  final String serviceName;
  const BookingScreen({super.key, required this.serviceName});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _currentStep = 0;
  final List<String> _steps = ['الخدمة', 'الطبيب', 'الفرع', 'التاريخ', 'الوقت', 'المراجعة'];
  String? _selectedDoctor;
  String? _selectedBranch;
  String? _selectedBranchId;
  String? _selectedServiceId;
  DateTime? _selectedDate;
  String? _selectedTime;
  bool _isLoading = false;
  List<Map<String, dynamic>> _branches = [];
  Map<String, dynamic>? _currentService;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final branchesResponse = await Supabase.instance.client.from('branches').select();
      final serviceResponse = await Supabase.instance.client.from('services').select().eq('name_ar', widget.serviceName).limit(1);
      
      if (serviceResponse.isNotEmpty) {
        _currentService = serviceResponse.first;
        _selectedServiceId = _currentService!['id'];
      }
      
      if (mounted) {
        setState(() {
          _branches = List<Map<String, dynamic>>.from(branchesResponse);
        });
      }
    } catch (e) {
      print('Error loading data: $e');
    }
  }

  Future<void> _ensureProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) throw Exception('يجب تسجيل الدخول أولاً');
    final profile = await Supabase.instance.client.from('profiles').select().eq('id', user.id).maybeSingle();
    if (profile == null) {
      await Supabase.instance.client.from('profiles').insert({'id': user.id, 'email': user.email});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, color: Color(0xFFB76E79)), onPressed: () => Navigator.pop(context)),
        title: const Text('حجز موعد', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: List.generate(_steps.length, (index) {
                return Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          color: index <= _currentStep ? const Color(0xFFB76E79) : Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: index <= _currentStep ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8)),
                        ),
                        child: Center(child: Text('${index + 1}', style: TextStyle(color: index <= _currentStep ? Colors.white : const Color(0xFFB76E79), fontSize: 13, fontWeight: FontWeight.w600))),
                      ),
                      if (index < _steps.length - 1) Expanded(child: Container(height: 2, color: index < _currentStep ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8).withOpacity(0.5))),
                    ],
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withOpacity(0.9)),
                boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: SingleChildScrollView( // يمنع الـ Overflow نهائياً
                    padding: const EdgeInsets.all(8),
                    child: _buildStepContent(),
                  ),
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                if (_currentStep > 0) ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentStep--),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), side: const BorderSide(color: Color(0xFFB76E79)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      child: const Text('السابق', style: TextStyle(color: Color(0xFFB76E79), fontSize: 15, fontWeight: FontWeight.w600, fontFamily: 'Tajawal')),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : () {
                      if (_currentStep < _steps.length - 1) {
                        setState(() => _currentStep++);
                      } else {
                        _confirmBooking();
                      }
                    },
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), backgroundColor: const Color(0xFFB76E79), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                        : Text(_currentStep == _steps.length - 1 ? 'تأكيد الحجز' : 'التالي', style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600, fontFamily: 'Tajawal')),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0: return _buildServiceStep();
      case 1: return _buildDoctorStep();
      case 2: return _buildBranchStep();
      case 3: return _buildDateStep();
      case 4: return _buildTimeStep();
      case 5: return _buildReviewStep();
      default: return const SizedBox();
    }
  }

  Widget _buildServiceStep() {
    if (_currentService == null) return const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر الخدمة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFB76E79))),
          child: Row(
            children: [
              const Icon(Icons.spa, color: Color(0xFFB76E79), size: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.serviceName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                    const SizedBox(height: 4),
                    Text('${_currentService!['duration_minutes']} دقيقة', style: const TextStyle(fontSize: 13, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  ],
                ),
              ),
              const Icon(Icons.check_circle, color: Color(0xFFB76E79), size: 24),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDoctorStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر الطبيب', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        _buildDoctorOption('د. أحمد محمد', 'استشاري طب تجميلي', '4.9'),
        const SizedBox(height: 12),
        _buildDoctorOption('د. سارة علي', 'أخصائية جلدية', '4.8'),
        const SizedBox(height: 12),
        _buildDoctorOption('أي طبيب متاح', 'سيتم اختيار أفضل طبيب', ''),
      ],
    );
  }

  Widget _buildDoctorOption(String name, String specialty, String rating) {
    bool isSelected = _selectedDoctor == name;
    return GestureDetector(
      onTap: () => setState(() => _selectedDoctor = name),
      child: Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFB76E79).withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8), width: isSelected ? 2 : 1),
        ),
        child: Row(
          children: [
            Container(width: 50, height: 50, decoration: BoxDecoration(color: const Color(0xFFE8B4B8).withOpacity(0.3), shape: BoxShape.circle), child: const Icon(Icons.person, color: Color(0xFFB76E79), size: 28)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  const SizedBox(height: 4),
                  Text(specialty, style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                ],
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle, color: Color(0xFFB76E79), size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildBranchStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر الفرع', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        if (_branches.isEmpty) const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
        else ..._branches.map((branch) => _buildBranchOption(branch['name_ar'], branch['address'] ?? '', '09:00 ص - 10:00 م', branch['id'])),
      ],
    );
  }

  Widget _buildBranchOption(String name, String address, String hours, String branchId) {
    bool isSelected = _selectedBranchId == branchId;
    return GestureDetector(
      onTap: () => setState(() { _selectedBranch = name; _selectedBranchId = branchId; }),
      child: Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFB76E79).withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8), width: isSelected ? 2 : 1),
        ),
        child: Row(
          children: [
            Container(width: 50, height: 50, decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.location_on, color: Color(0xFFB76E79), size: 28)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  const SizedBox(height: 4),
                  Text(address, style: TextStyle(fontSize: 12, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                  const SizedBox(height: 4),
                  Text(hours, style: const TextStyle(fontSize: 11, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
                ],
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle, color: Color(0xFFB76E79), size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDateStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر التاريخ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: const Color(0xFF333333).withOpacity(0.03), borderRadius: BorderRadius.circular(20)),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(7, (index) {
                DateTime date = DateTime.now().add(Duration(days: index));
                bool isSelected = _selectedDate?.day == date.day;
                return GestureDetector(
                  onTap: () => setState(() => _selectedDate = date),
                  child: Container(
                    width: 60,
                    margin: EdgeInsets.only(right: index == 0 ? 0 : 12),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFB76E79) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isSelected ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8)),
                    ),
                    child: Column(
                      children: [
                        Text(['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][date.weekday % 7], style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                        const SizedBox(height: 8),
                        Text('${date.day}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : const Color(0xFF333333), fontFamily: 'Tajawal')),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeStep() {
    List<String> times = ['09:00 ص', '10:00 ص', '11:00 ص', '12:00 م', '02:00 م', '03:00 م', '04:00 م', '05:00 م'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('اختر الوقت', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: times.map((time) {
            bool isSelected = _selectedTime == time;
            return GestureDetector(
              onTap: () => setState(() => _selectedTime = time),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFB76E79) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8)),
                ),
                child: Text(time, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : const Color(0xFF333333), fontFamily: 'Tajawal')),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    if (_currentService == null) return const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('مراجعة الحجز', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        const SizedBox(height: 24),
        _buildReviewItem('الخدمة', widget.serviceName),
        const SizedBox(height: 12),
        _buildReviewItem('الطبيب', _selectedDoctor ?? 'لم يتم الاختيار'),
        const SizedBox(height: 12),
        _buildReviewItem('الفرع', _selectedBranch ?? 'لم يتم الاختيار'),
        const SizedBox(height: 12),
        _buildReviewItem('التاريخ', _selectedDate != null ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}' : 'لم يتم الاختيار'),
        const SizedBox(height: 12),
        _buildReviewItem('الوقت', _selectedTime ?? 'لم يتم الاختيار'),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFB76E79))),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('المبلغ المطلوب', style: TextStyle(fontSize: 14, color: Color(0xFF333333), fontFamily: 'Tajawal')),
              Text('${_currentService!['price_iqd']} د.ع', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF333333).withOpacity(0.03), borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        ],
      ),
    );
  }

  Future<void> _confirmBooking() async {
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception('يجب تسجيل الدخول أولاً');
      if (_selectedBranchId == null) throw Exception('يرجى اختيار الفرع');
      if (_selectedServiceId == null) throw Exception('الخدمة غير متوفرة حالياً');

      await _ensureProfile();

      await Supabase.instance.client.from('appointments').insert({
        'patient_id': user.id,
        'service_id': _selectedServiceId,
        'branch_id': _selectedBranchId,
        'doctor_name': _selectedDoctor,
        'appointment_date': _selectedDate != null ? '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}' : '',
        'appointment_time': _selectedTime ?? '',
        'status': 'pending',
        'total_price_iqd': _currentService?['price_iqd'] ?? 75000,
      });

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Column(
            children: [
              Container(width: 70, height: 70, decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), shape: BoxShape.circle), child: const Icon(Icons.check, color: Color(0xFFB76E79), size: 40)),
              const SizedBox(height: 16),
              const Text('تم الحجز بنجاح!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
            ],
          ),
          content: const Text('تم حفظ موعدك في النظام وسيتم التواصل معك للتأكيد', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Color(0xFF333333), fontFamily: 'Tajawal')),
          actions: [
            Center(
              child: ElevatedButton(
                onPressed: () { Navigator.pop(context); Navigator.pop(context); },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFB76E79), padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                child: const Text('حسناً', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600, fontFamily: 'Tajawal')),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل الحجز: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
