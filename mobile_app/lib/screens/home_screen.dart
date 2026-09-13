import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:ui';
import 'services_screen.dart';
import 'doctors_screen.dart';
import 'branches_tab.dart';
import 'profile_screen.dart';
import 'offers_screen.dart';
import 'booking/booking_screen.dart';
import 'user_screens.dart';
import 'notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<_HomeContentState> _homeKey = GlobalKey<_HomeContentState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomeContent(key: _homeKey),
          const ServicesScreen(),
          const DoctorsScreen(),
          const BranchesTab(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        margin: const EdgeInsets.all(16),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.85),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: Colors.white.withOpacity(0.9)),
                boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.25), blurRadius: 25, offset: const Offset(0, 10))],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _navItem(Icons.home_rounded, 0, 'الرئيسية'),
                  _navItem(Icons.spa_rounded, 1, 'الخدمات'),
                  _navItem(Icons.medical_services_rounded, 2, 'الأطباء'),
                  _navItem(Icons.location_on_rounded, 3, 'الفروع'),
                  _navItem(Icons.person_rounded, 4, 'حسابي'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(IconData icon, int index, String label) {
    final selected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _currentIndex = index);
        if (index == 0) _homeKey.currentState?.refresh();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        padding: EdgeInsets.symmetric(horizontal: selected ? 18 : 12, vertical: 10),
        decoration: BoxDecoration(
          gradient: selected ? const LinearGradient(colors: [Color(0xFFB76E79), Color(0xFFD4909C)]) : null,
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected ? [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 5))] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: selected ? Colors.white : const Color(0xFFB76E79).withOpacity(0.6)),
            if (selected) ...[
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700, fontFamily: 'Tajawal')),
            ],
          ],
        ),
      ),
    );
  }
}

class HomeContent extends StatefulWidget {
  const HomeContent({super.key});
  @override
  State<HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<HomeContent> {
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> _offers = [];
  List<Map<String, dynamic>> _branches = [];
  Map<String, dynamic> _settings = {};
  bool _loading = true;
  int _unread = 0;
  RealtimeChannel? _notifChannel;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    refresh();
    _loadUnread();
    _subscribeNotif();
  }

  @override
  void dispose() {
    _notifChannel?.unsubscribe();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> refresh() async {
    final client = Supabase.instance.client;
    try { _services = List<Map<String, dynamic>>.from(await client.from('services').select().eq('is_active', true)); } catch (_) {}
    try { _doctors = List<Map<String, dynamic>>.from(await client.from('doctors').select().eq('is_active', true)); } catch (_) {}
    try { _offers = List<Map<String, dynamic>>.from(await client.from('offers').select().eq('is_active', true)); } catch (_) {}
    try { _branches = List<Map<String, dynamic>>.from(await client.from('branches').select().eq('is_active', true)); } catch (_) {}
    try {
      final st = await client.from('app_settings').select().limit(1);
      if (st.isNotEmpty) _settings = Map<String, dynamic>.from(st[0]);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadUnread() async {
    final u = Supabase.instance.client.auth.currentUser;
    if (u == null) return;
    try {
      final res = await Supabase.instance.client.from('notifications').select('id').eq('user_id', u.id).eq('is_read', false);
      if (mounted) setState(() => _unread = res.length);
    } catch (_) {}
  }

  void _subscribeNotif() {
    final u = Supabase.instance.client.auth.currentUser;
    if (u == null) return;
    _notifChannel = Supabase.instance.client
        .channel('home_notif_${u.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'user_id', value: u.id),
          callback: (payload) => _loadUnread(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'user_id', value: u.id),
          callback: (payload) => _loadUnread(),
        )
        .subscribe();
  }

  void _openSearch(String q) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => SearchScreen(initialQuery: q.trim())));
  }

  String _serviceImage(Map<String, dynamic> s) {
    final url = s['image_url'];
    if (url != null && url.toString().startsWith('http')) return url.toString();
    final name = (s['name_ar'] ?? '').toString();
    if (name.contains('ليزر')) return 'assets/images/laser.jpg';
    if (name.contains('بشرة') || name.contains('تجميل')) return 'assets/images/skin_care.jpg';
    if (name.contains('فلر') || name.contains('بوتوكس')) return 'assets/images/facial.jpg';
    return 'assets/images/treatment.jpg';
  }

  Widget _img(String src) {
    if (src.startsWith('http')) {
      return Image.network(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _placeholder());
    }
    return Image.asset(src, fit: BoxFit.cover, errorBuilder: (c, e, s) => _placeholder());
  }

  Widget _placeholder() {
    return Container(
      decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)])),
      child: const Center(child: Icon(Icons.spa, color: Colors.white, size: 40)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(backgroundColor: Color(0xFFF8F4F0), body: Center(child: CircularProgressIndicator(color: Color(0xFFB76E79))));
    }
    return RefreshIndicator(
      onRefresh: refresh,
      color: const Color(0xFFB76E79),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildOffersBanner(),
            const SizedBox(height: 24),
            _sectionHeader('خدماتنا المميزة', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ServicesScreen()))),
            const SizedBox(height: 14),
            _buildServices(),
            const SizedBox(height: 24),
            _sectionHeader('عروض حصرية', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OffersScreen()))),
            const SizedBox(height: 14),
            _buildOffersRow(),
            const SizedBox(height: 24),
            _sectionHeader('نخبة الأطباء', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DoctorsScreen()))),
            const SizedBox(height: 14),
            _buildDoctors(),
            const SizedBox(height: 24),
            _sectionHeader('فروعنا', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BranchesTab()))),
            const SizedBox(height: 14),
            _buildBranches(),
            const SizedBox(height: 110),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final user = Supabase.instance.client.auth.currentUser;
    final name = user?.email?.split('@').first ?? 'جميلتنا';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFB76E79), Color(0xFFC98A94), Color(0xFFE8B4B8)]),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
      ),
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 20, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.auto_awesome, color: Colors.white, size: 22)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('مرحباً ' + name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text((_settings['hero_subtitle'] ?? 'جمالك يبدأ من هنا').toString(), style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12, fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (_) => const AppNotificationsScreen()));
                  _loadUnread();
                },
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.notifications_none, color: Colors.white, size: 22),
                      if (_unread > 0)
                        Positioned(
                          top: -5,
                          right: -5,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(color: const Color(0xFFC62828), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white, width: 1)),
                            child: Text(_unread > 9 ? '9+' : _unread.toString(), style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(18)),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white, fontFamily: 'Tajawal'),
              onSubmitted: _openSearch,
              decoration: InputDecoration(
                hintText: 'ابحثي عن خدمة...',
                hintStyle: const TextStyle(color: Colors.white70, fontFamily: 'Tajawal'),
                border: InputBorder.none,
                icon: const Icon(Icons.search, color: Colors.white),
                suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward, color: Colors.white), onPressed: () => _openSearch(_searchCtrl.text)),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms);
  }

  Widget _buildOffersBanner() {
    if (_offers.isNotEmpty) {
      return SizedBox(
        height: 180,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: _offers.length,
          itemBuilder: (context, index) => _offerCard(_offers[index]),
        ),
      );
    }
    return Container(
      height: 180,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset('assets/images/lobby.jpg', fit: BoxFit.cover, errorBuilder: (c, e, s) => _placeholder()),
            Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: [const Color(0xFFB76E79).withOpacity(0.75), const Color(0xFFE8B4B8).withOpacity(0.35)]))),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.3), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.5))),
                    child: Text((_settings['hero_badge'] ?? '✨ عرض خاص').toString(), style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'Tajawal', fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 10),
                  Flexible(
                    child: Text((_settings['hero_title'] ?? 'جمالك يستحق الأفضل').toString(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w300, color: Colors.white, fontFamily: 'Tajawal', height: 1.1), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
                  const SizedBox(height: 14),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingScreen(serviceName: 'تجميل البشرة'))),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                      child: const Row(mainAxisSize: MainAxisSize.min, children: [Text('احجزي الآن', style: TextStyle(color: Color(0xFFB76E79), fontSize: 13, fontWeight: FontWeight.w700, fontFamily: 'Tajawal')), SizedBox(width: 6), Icon(Icons.arrow_back, color: Color(0xFFB76E79), size: 16)]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 800.ms).slideX(begin: 0.3, end: 0, duration: 800.ms);
  }

  Widget _offerCard(Map<String, dynamic> offer) {
    final discount = offer['discount_percentage'] ?? 0;
    final url = offer['image_url'];
    final img = (url != null && url.toString().startsWith('http')) ? url.toString() : 'assets/images/treatment.jpg';
    return Container(
      width: 280,
      margin: const EdgeInsets.only(left: 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _img(img),
            Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, const Color(0xFF7A3B47).withOpacity(0.9)]))),
            Positioned(top: 12, right: 12, child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)), child: Text('خصم ' + discount.toString() + '%', style: const TextStyle(color: Color(0xFFB76E79), fontSize: 12, fontWeight: FontWeight.w800, fontFamily: 'Tajawal')))),
            Positioned(
              bottom: 14, left: 14, right: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text((offer['title_ar'] ?? '').toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Flexible(child: Text(offer['discounted_price'].toString() + ' د.ع', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white, fontFamily: 'Tajawal'), overflow: TextOverflow.ellipsis)),
                      const SizedBox(width: 10),
                      Text(offer['original_price'].toString() + ' د.ع', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7), decoration: TextDecoration.lineThrough, fontFamily: 'Tajawal')),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: const Duration(milliseconds: 100), duration: 600.ms);
  }

  Widget _sectionHeader(String title, VoidCallback onAll) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Container(width: 5, height: 22, decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFB76E79), Color(0xFFE8B4B8)]), borderRadius: BorderRadius.circular(4))),
          const SizedBox(width: 10),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'), overflow: TextOverflow.ellipsis)),
          GestureDetector(onTap: onAll, child: Text('عرض الكل', style: TextStyle(fontSize: 13, color: const Color(0xFFB76E79).withOpacity(0.9), fontFamily: 'Tajawal'))),
        ],
      ),
    );
  }

  Widget _buildServices() {
    if (_services.isEmpty) {
      return const SizedBox(height: 60, child: Center(child: Text('لا توجد خدمات', style: TextStyle(fontFamily: 'Tajawal'))));
    }
    return SizedBox(
      height: 220,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _services.length,
        itemBuilder: (context, index) {
          final s = _services[index];
          final name = (s['name_ar'] ?? '').toString();
          final price = s['price_iqd'].toString();
          final duration = s['duration_minutes'].toString();
          return GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(serviceName: name))),
            child: Container(
              width: 165,
              margin: const EdgeInsets.only(left: 12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.15), blurRadius: 15, offset: const Offset(0, 6))]),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    child: SizedBox(
                      height: 120,
                      width: 165,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _img(_serviceImage(s)),
                          Positioned(bottom: 8, right: 8, child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(12)), child: Text(price + ' د.ع', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFB76E79), fontFamily: 'Tajawal')))),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.schedule, size: 14, color: Color(0xFFB76E79)),
                            const SizedBox(width: 4),
                            Flexible(child: Text(duration + ' دقيقة', style: TextStyle(fontSize: 11, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal'), overflow: TextOverflow.ellipsis)),
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

  Widget _buildOffersRow() {
    if (_offers.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(gradient: LinearGradient(colors: [const Color(0xFFB76E79).withOpacity(0.1), const Color(0xFFE8B4B8).withOpacity(0.1)]), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFB76E79).withOpacity(0.2))),
          child: const Row(children: [Icon(Icons.local_offer, color: Color(0xFFB76E79)), SizedBox(width: 12), Flexible(child: Text('أضيفي عروضاً من لوحة التحكم', style: TextStyle(fontSize: 13, fontFamily: 'Tajawal', color: Color(0xFF333333)), overflow: TextOverflow.ellipsis))]),
        ),
      );
    }
    return SizedBox(
      height: 170,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _offers.length,
        itemBuilder: (context, index) => _offerCard(_offers[index]),
      ),
    );
  }

  Widget _buildDoctors() {
    if (_doctors.isEmpty) {
      return const SizedBox(height: 60, child: Center(child: Text('لا يوجد أطباء', style: TextStyle(fontFamily: 'Tajawal'))));
    }
    return SizedBox(
      height: 190,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _doctors.length,
        itemBuilder: (context, index) {
          final d = _doctors[index];
          final name = (d['name'] ?? '').toString();
          final spec = (d['specialty'] ?? '').toString();
          return Container(
            width: 160,
            margin: const EdgeInsets.only(left: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.15), blurRadius: 15, offset: const Offset(0, 6))]),
            child: Column(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(shape: BoxShape.circle, gradient: const LinearGradient(colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)]), border: Border.all(color: Colors.white, width: 3), boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.4), blurRadius: 12)]),
                      child: d['image_url'] != null && d['image_url'].toString().startsWith('http') ? ClipOval(child: Image.network(d['image_url'].toString(), fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.person, color: Colors.white, size: 30))) : const Icon(Icons.person, color: Colors.white, size: 30),
                    ),
                    Positioned(bottom: 0, left: 0, child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(8)), child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.star, size: 10, color: Colors.white), SizedBox(width: 2), Text('5.0', style: TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w800))]))),
                  ],
                ),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: Text(spec, style: const TextStyle(fontSize: 11, color: Color(0xFFB76E79), fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: index * 80), duration: 500.ms);
        },
      ),
    );
  }

  Widget _buildBranches() {
    if (_branches.isEmpty) {
      return const SizedBox(height: 60, child: Center(child: Text('لا توجد فروع', style: TextStyle(fontFamily: 'Tajawal'))));
    }
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _branches.length,
        itemBuilder: (context, index) {
          final b = _branches[index];
          final bName = (b['name_ar'] ?? '').toString();
          final bAddr = (b['address'] ?? '').toString();
          return Container(
            width: 240,
            margin: const EdgeInsets.only(left: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.12), blurRadius: 10, offset: const Offset(0, 4))]),
            child: Row(
              children: [
                Container(width: 40, height: 40, decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.location_on, color: Color(0xFFB76E79), size: 20)),
                const SizedBox(width: 10),
                SizedBox(
                  width: 150,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(bName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF333333), fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 3),
                      Text(bAddr, style: TextStyle(fontSize: 10, color: const Color(0xFF333333).withOpacity(0.5), fontFamily: 'Tajawal'), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: index * 80), duration: 500.ms);
        },
      ),
    );
  }
}
