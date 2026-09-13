import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:ui';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});

  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  List<Map<String, dynamic>> _branches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBranches();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadBranches();
  }

  Future<void> _loadBranches() async {
    try {
      print('🔍 جاري تحميل الفروع...');
      final response = await Supabase.instance.client
          .from('branches')
          .select()
          .eq('is_active', true)
          .order('created_at', ascending: false);
      
      print('✅ عدد الفروع: ${response.length}');
      
      if (mounted) {
        setState(() {
          _branches = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ خطأ في تحميل الفروع: $e');
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
        title: const Text('فروعنا', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadBranches,
        color: const Color(0xFFB76E79),
        child: _branches.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Opacity(opacity: 0.3, child: const Icon(Icons.location_off, size: 80, color: Color(0xFFB76E79))),
                    const SizedBox(height: 16),
                    const Text('لا توجد فروع', style: TextStyle(fontSize: 18, fontFamily: 'Tajawal')),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _branches.length,
                itemBuilder: (context, index) {
                  final branch = _branches[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: const Color(0xFFB76E79).withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 5))],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 50, height: 50,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFB76E79).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.location_on, color: Color(0xFFB76E79), size: 28),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(branch['name_ar'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                                    if (branch['address'] != null) Text(branch['address'], style: TextStyle(fontSize: 13, color: const Color(0xFF333333).withOpacity(0.6), fontFamily: 'Tajawal')),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (branch['phone'] != null) ...[
                            const SizedBox(height: 12),
                            Row(children: [
                              const Icon(Icons.phone, size: 16, color: Color(0xFFB76E79)),
                              const SizedBox(width: 8),
                              Text(branch['phone'], style: const TextStyle(fontSize: 14, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                            ]),
                          ],
                          if (branch['working_hours'] != null) ...[
                            const SizedBox(height: 8),
                            Row(children: [
                              const Icon(Icons.access_time, size: 16, color: Color(0xFFB76E79)),
                              const SizedBox(width: 8),
                              Text(branch['working_hours'], style: const TextStyle(fontSize: 14, color: Color(0xFF333333), fontFamily: 'Tajawal')),
                            ]),
                          ],
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: Duration(milliseconds: index * 100), duration: 600.ms);
                },
              ),
      ),
    );
  }
}
