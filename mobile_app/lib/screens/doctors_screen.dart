import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'details/doctor_details_screen.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});
  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  List<Map<String, dynamic>> _doctors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    try {
      final response = await Supabase.instance.client
          .from('doctors')
          .select()
          .eq('is_active', true)
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _doctors = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8F4F0),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFB76E79))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'نخبة الأخصائيين',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFFB76E79), fontFamily: 'Tajawal'),
        ),
        centerTitle: true,
      ),
      // ✅ الحل هنا: إضافة padding من الأسفل لمنع اختفاء آخر عنصر
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 120), 
        itemCount: _doctors.length,
        itemBuilder: (context, index) {
          final d = _doctors[index];
          final name = (d['name'] ?? '').toString();
          final spec = (d['specialty'] ?? '').toString();
          final imgUrl = (d['image_url'] ?? '').toString();

          return GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => DoctorDetailsScreen(doctor: d)),
            ),
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFB76E79).withOpacity(0.1),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  )
                ],
              ),
              child: Row(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)]),
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                        child: imgUrl.startsWith('http')
                            ? ClipOval(
                                child: Image.network(
                                  imgUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (c, e, s) => const Icon(Icons.person, color: Colors.white, size: 35),
                                ),
                              )
                            : const Icon(Icons.person, color: Colors.white, size: 35),
                      ),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD4AF37),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, size: 10, color: Colors.white),
                              SizedBox(width: 2),
                              Text('5.0', style: TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF333333),
                            fontFamily: 'Tajawal',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFB76E79).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            spec,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFFB76E79),
                              fontFamily: 'Tajawal',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xFFB76E79)),
                ],
              ),
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: index * 100), duration: 500.ms);
        },
      ),
    );
  }
}