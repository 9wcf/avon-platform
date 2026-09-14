import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../booking/booking_screen.dart';

class DoctorDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> doctor;
  const DoctorDetailsScreen({super.key, required this.doctor});

  @override
  Widget build(BuildContext context) {
    final name = (doctor['name'] ?? '').toString();
    final specialty = (doctor['specialty'] ?? '').toString();
    final imgUrl = (doctor['image_url'] ?? '').toString();
    final bio = (doctor['bio'] ?? '').toString();
    final exp = (doctor['experience_years'] ?? 0).toString();
    final ops = (doctor['operations_count'] ?? 0).toString();
    final rate = (doctor['satisfaction_rate'] ?? 95).toString();
    final quals = List<String>.from(doctor['qualifications'] ?? []);
    final specs = List<String>.from(doctor['specialties_list'] ?? []);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      body: CustomScrollView(
        slivers: [
          // ========== الهيدر مع الصورة ==========
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: const Color(0xFFB76E79),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.3), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // الصورة
                  imgUrl.isNotEmpty
                      ? Image.network(imgUrl, fit: BoxFit.cover, errorBuilder: (c, e, s) => _placeholder())
                      : _placeholder(),
                  // تدرج
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, const Color(0xFFB76E79).withOpacity(0.9)],
                      ),
                    ),
                  ),
                  // الاسم والتخصص بالأسفل
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal')),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.3), borderRadius: BorderRadius.circular(12)),
                          child: Text(specialty, style: const TextStyle(fontSize: 14, color: Colors.white, fontFamily: 'Tajawal')),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ========== المحتوى ==========
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // الإحصائيات
                  Row(
                    children: [
                      _statCard('سنوات الخبرة', exp, Icons.work_outline),
                      const SizedBox(width: 12),
                      _statCard('عملية ناجحة', ops, Icons.medical_services_outlined),
                      const SizedBox(width: 12),
                      _statCard('نسبة الرضا', '$rate%', Icons.favorite_outline),
                    ],
                  ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 24),

                  // النبذة
                  _sectionTitle('نبذة عن الطبيب', Icons.person_outline),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Text(bio, style: const TextStyle(fontSize: 14, height: 1.8, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  ).animate().fadeIn(delay: 200.ms, duration: 600.ms),

                  const SizedBox(height: 24),

                  // المؤهلات
                  if (quals.isNotEmpty) ...[
                    _sectionTitle('المؤهلات العلمية', Icons.school_outlined),
                    const SizedBox(height: 12),
                    ...quals.map((q) => _listItem(q, Icons.verified_user)),
                    const SizedBox(height: 24),
                  ],

                  // التخصصات
                  if (specs.isNotEmpty) ...[
                    _sectionTitle('التخصصات', Icons.star_outline),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: specs.map((s) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [const Color(0xFFB76E79).withOpacity(0.1), const Color(0xFFE8B4B8).withOpacity(0.1)]),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFB76E79).withOpacity(0.3)),
                        ),
                        child: Text(s, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
                      )).toList(),
                    ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
                    const SizedBox(height: 24),
                  ],

                  // زر الحجز
                  ElevatedButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(serviceName: specialty))),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB76E79),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.calendar_today, color: Colors.white),
                        const SizedBox(width: 8),
                        Text('احجز موعد مع د. ' + name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white, fontFamily: 'Tajawal')),
                      ],
                    ),
                  ).animate().fadeIn(delay: 500.ms, duration: 600.ms).slideY(begin: 0.3, end: 0),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)])),
      child: const Center(child: Icon(Icons.person, color: Colors.white, size: 80)),
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFFB76E79), size: 24),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal'), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: const Color(0xFFB76E79), size: 20),
        ),
        const SizedBox(width: 10),
        Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
      ],
    );
  }

  Widget _listItem(String text, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFB76E79), size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14, color: Color(0xFF333333), fontFamily: 'Tajawal'))),
        ],
      ),
    );
  }
}
