import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'booking/booking_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});
  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  List<Map<String, dynamic>> _services = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await Supabase.instance.client.from('services').select().eq('is_active', true).order('created_at', ascending: false);
      if (mounted) setState(() { _services = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (e) { if (mounted) setState(() => _loading = false); }
  }

  String _image(Map<String, dynamic> s) {
    final url = s['image_url'];
    if (url != null && url.toString().startsWith('http')) return url.toString();
    final name = (s['name_ar'] ?? '').toString();
    if (name.contains('ليزر')) return 'assets/images/laser.jpg';
    if (name.contains('بشرة') || name.contains('تجميل')) return 'assets/images/skin_care.jpg';
    if (name.contains('فلر') || name.contains('بوتوكس')) return 'assets/images/facial.jpg';
    return 'assets/images/treatment.jpg';
  }

  Widget _img(String src) {
    if (src.startsWith('http')) return Image.network(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _ph());
    return Image.asset(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _ph());
  }

  Widget _ph() => Container(
    decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)])),
    child: const Center(child: Icon(Icons.spa, color: Colors.white, size: 40)),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('خدماتنا', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFFB76E79),
              child: ListView.builder(
                // ✅ التعديل هنا: زيادة المسافة من الأسفل لمنع اختفاء آخر خدمة
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                itemCount: _services.length,
                itemBuilder: (context, index) {
                  final s = _services[index];
                  final name = (s['name_ar'] ?? '').toString();
                  return GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(serviceName: name))),
                    child: Container(
                      height: 190,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            _img(_image(s)),
                            Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, const Color(0xFF7A3B47).withOpacity(0.9)]))),
                            Positioned(
                              top: 12, right: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(14)),
                                child: Text(s['duration_minutes'].toString() + ' دقيقة', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
                              ),
                            ),
                            Positioned(
                              bottom: 14, left: 14, right: 14,
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal')),
                                        const SizedBox(height: 4),
                                        Text('يبدأ من ' + s['price_iqd'].toString() + ' د.ع', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.9), fontFamily: 'Tajawal')),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(color: const Color(0xFFB76E79), borderRadius: BorderRadius.circular(14)),
                                    child: const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: Duration(milliseconds: index * 80), duration: 500.ms).slideY(begin: 0.2, end: 0, duration: 500.ms);
                },
              ),
            ),
    );
  }
}