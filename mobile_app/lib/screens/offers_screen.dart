import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});
  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  List<Map<String, dynamic>> _offers = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await Supabase.instance.client.from('offers').select().eq('is_active', true).order('created_at', ascending: false);
      if (mounted) setState(() { _offers = List<Map<String, dynamic>>.from(res); _loading = false; });
    } catch (e) { if (mounted) setState(() => _loading = false); }
  }

  Widget _img(String src) {
    if (src.startsWith('http')) return Image.network(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _ph());
    return Image.asset(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _ph());
  }

  Widget _ph() => Container(
    decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)])),
    child: const Center(child: Icon(Icons.local_offer, color: Colors.white, size: 40)),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('عروض حصرية', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
          : _offers.isEmpty
              ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.local_offer, size: 70, color: Color(0xFFE8B4B8)), SizedBox(height: 12), Text('لا توجد عروض حالياً', style: TextStyle(fontSize: 16, fontFamily: 'Tajawal', color: Color(0xFF333333)))]))
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _offers.length,
                  itemBuilder: (context, index) {
                    final o = _offers[index];
                    final url = o['image_url'];
                    final img = (url != null && url.toString().startsWith('http')) ? url.toString() : 'assets/images/treatment.jpg';
                    return Container(
                      height: 200,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            _img(img),
                            Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, const Color(0xFF7A3B47).withOpacity(0.9)]))),
                            Positioned(
                              top: 12, right: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                                child: Text('خصم ' + o['discount_percentage'].toString() + '%', style: const TextStyle(color: Color(0xFFB76E79), fontSize: 13, fontWeight: FontWeight.w800, fontFamily: 'Tajawal')),
                              ),
                            ),
                            Positioned(
                              bottom: 16, left: 16, right: 16,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text((o['title_ar'] ?? '').toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal')),
                                  const SizedBox(height: 4),
                                  if (o['description'] != null) Text(o['description'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.85), fontFamily: 'Tajawal')),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(o['discounted_price'].toString() + ' د.ع', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal')),
                                      const SizedBox(width: 10),
                                      Text(o['original_price'].toString() + ' د.ع', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.7), decoration: TextDecoration.lineThrough, fontFamily: 'Tajawal')),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: Duration(milliseconds: index * 80), duration: 500.ms).slideY(begin: 0.2, end: 0, duration: 500.ms);
                  },
                ),
    );
  }
}
