import 'package:flutter/material.dart';
import 'login_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'user_screens.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  int _appointmentsCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }
      final profileResponse = await Supabase.instance.client.from('profiles').select().eq('id', user.id).maybeSingle();
      final appointmentsResponse = await Supabase.instance.client.from('appointments').select('id').eq('patient_id', user.id);
      if (mounted) {
        setState(() {
          _user = profileResponse;
          _appointmentsCount = appointmentsResponse.length;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    await Supabase.instance.client.auth.signOut();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(backgroundColor: Color(0xFFF8F4F0), body: Center(child: CircularProgressIndicator(color: Color(0xFFB76E79))));
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? '';
    final displayName = _user?['full_name'] ?? email.split('@').first;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            expandedHeight: 200,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFB76E79), Color(0xFFE8B4B8)]),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 5))]),
                        child: const Icon(Icons.person, size: 40, color: Color(0xFFB76E79)),
                      ),
                      const SizedBox(height: 12),
                      Text(displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white, fontFamily: 'Tajawal')),
                      const SizedBox(height: 4),
                      Text(email, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.9), fontFamily: 'Tajawal')),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatCard(),
                  const SizedBox(height: 24),
                  const Text('القائمة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                  const SizedBox(height: 16),
                  _buildMenuItem(Icons.calendar_today, 'حجوزاتي', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AppointmentsScreen()))),
                  const SizedBox(height: 12),
                  _buildMenuItem(Icons.history, 'سجل الحجوزات', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingHistoryScreen()))),
                  const SizedBox(height: 12),
                  _buildMenuItem(Icons.notifications, 'الإشعارات', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()))),
                  const SizedBox(height: 12),
                  _buildMenuItem(Icons.settings, 'الإعدادات', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
                  const SizedBox(height: 24),
                  _buildLogoutButton(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.8)),
        boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('الحجوزات', _appointmentsCount, Icons.event),
          Container(width: 1, height: 50, color: const Color(0xFFB76E79).withOpacity(0.2)),
          _buildStatItem('النقاط', 0, Icons.card_giftcard),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 32, color: const Color(0xFFB76E79)),
        const SizedBox(height: 8),
        Text('$value', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        Text(label, style: TextStyle(fontSize: 14, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.8)),
      ),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(color: const Color(0xFFB76E79).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: const Color(0xFFB76E79), size: 24),
        ),
        title: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF333333), fontFamily: 'Tajawal')),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xFFB76E79)),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFE74C3C).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE74C3C).withOpacity(0.3)),
      ),
      child: ListTile(
        onTap: _logout,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(color: const Color(0xFFE74C3C).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.logout, color: Color(0xFFE74C3C), size: 24),
        ),
        title: const Text('تسجيل الخروج', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFFE74C3C), fontFamily: 'Tajawal')),
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
  }}