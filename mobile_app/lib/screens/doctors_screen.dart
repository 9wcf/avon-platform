import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'booking/booking_screen.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});
  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  List<Map<String, dynamic>> _doctors = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await Supabase.instance.client.from('doctors').select().eq('is_active', true).order('rating', ascending: false);
      if (mounted) setState(() { _doctors = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (e) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('نخبة الأطباء', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFFB76E79),
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _doctors.length,
                itemBuilder: (context, index) {
                  final d = _doctors[index];
                  final name = (d['name'] ?? '').toString();
                  final spec = (d['specialty'] ?? '').toString();
                  final exp = d['experience'];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.15), blurRadius: 15, offset: const Offset(0, 6))]),
                    child: Row(
                      children: [
                        Stack(
                          children: [
                            Container(
                              width: 72, height: 72,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)]),
                                border: Border.all(color: Colors.white, width: 3),
                                boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.4), blurRadius: 12)],
                              ),
                              child: d['image_url'] != null && d['image_url'].toString().startsWith('http')
                                  ? ClipOval(child: Image.network(d['image_url'].toString(), fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.person, color: Colors.white, size: 34)))
                                  : const Icon(Icons.person, color: Colors.white, size: 34),
                            ),
                            Positioned(
                              bottom: 0, left: 0,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white, width: 1.5)),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.star, size: 10, color: Colors.white),
                                    SizedBox(width: 3),
                                    Text('5.0', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w800)),
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
                              Text(name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                    child: Text(spec, style: const TextStyle(fontSize: 11, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
                                  ),
                                  if (exp != null) ...[
                                    const SizedBox(width: 8),
                                    Text(exp.toString() + ' سنة خبرة', style: TextStyle(fontSize: 11, color: const Color(0xFF333333).withOpacity(0.5), fontFamily: 'Tajawal')),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 12),
                              GestureDetector(
                                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingScreen(serviceName: 'تجميل البشرة'))),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                  decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFB76E79), Color(0xFFD4909C)]), borderRadius: BorderRadius.circular(14)),
                                  child: const Text('احجزي موعد', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, fontFamily: 'Tajawal')),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: Duration(milliseconds: index * 80), duration: 500.ms).slideX(begin: 0.2, end: 0, duration: 500.ms);
                },
              ),
            ),
    );
  }
}
