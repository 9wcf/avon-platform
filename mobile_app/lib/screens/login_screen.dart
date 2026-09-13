import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:ui';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLogin = true;
  bool _isLoading = false;
  String _errorMessage = '';
  bool _obscurePassword = true;
  late AnimationController _glowController;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  Future<void> _authenticate() async {
    if (!_isValidEmail(_emailController.text)) {
      setState(() => _errorMessage = 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (_passwordController.text.length < 6) {
      setState(() => _errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setState(() { _isLoading = true; _errorMessage = ''; });

    try {
      if (_isLogin) {
        await Supabase.instance.client.auth.signInWithPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        await Supabase.instance.client.auth.signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      }
      
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } on AuthException catch (e) {
      setState(() {
        if (e.message.contains('Invalid login credentials')) {
          _errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (e.message.contains('User already registered')) {
          _errorMessage = 'هذا البريد مسجل مسبقاً، يرجى تسجيل الدخول';
        } else {
          _errorMessage = e.message;
        }
      });
    } catch (e) {
      setState(() => _errorMessage = 'حدث خطأ غير متوقع');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _glowController,
        builder: (context, child) {
          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFFF8F4F0),
                  const Color(0xFFFFD4C4).withOpacity(0.5),
                  const Color(0xFFE8B4B8).withOpacity(0.5),
                ],
              ),
            ),
            child: Stack(
              children: [
                // دوائر متحركة في الخلفية
                Positioned(
                  top: -100,
                  right: -100,
                  child: Container(
                    width: 300,
                    height: 300,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFE8B4B8).withOpacity(0.4 + _glowController.value * 0.2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFB76E79).withOpacity(0.3),
                          blurRadius: 80,
                          spreadRadius: 20,
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: -150,
                  left: -100,
                  child: Container(
                    width: 350,
                    height: 350,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFFFD4C4).withOpacity(0.4 + _glowController.value * 0.2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFB76E79).withOpacity(0.3),
                          blurRadius: 100,
                          spreadRadius: 30,
                        ),
                      ],
                    ),
                  ),
                ),

                SafeArea(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),
                        
                        // زر الرجوع
                        Align(
                          alignment: Alignment.centerRight,
                          child: GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              width: 45,
                              height: 45,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.5),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.8)),
                              ),
                              child: const Icon(Icons.arrow_back_ios, color: Color(0xFFB76E79), size: 18),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 40),
                        
                        // الشعار
                        Center(
                          child: Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFB76E79).withOpacity(0.4),
                                  blurRadius: 30,
                                  spreadRadius: 10,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 50),
                          ),
                        ).animate().scale(duration: 800.ms, curve: Curves.elasticOut),
                        
                        const SizedBox(height: 30),
                        
                        const Text(
                          'AVON',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 42,
                            fontWeight: FontWeight.w300,
                            color: Color(0xFFB76E79),
                            letterSpacing: 8,
                            fontFamily: 'Tajawal',
                          ),
                        ).animate().fadeIn(duration: 800.ms),
                        
                        const SizedBox(height: 10),
                        
                        Text(
                          _isLogin ? 'مرحباً بعودتك' : 'انضمي إلينا',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: const Color(0xFFB76E79).withOpacity(0.7),
                            fontFamily: 'Tajawal',
                          ),
                        ).animate().fadeIn(delay: 300.ms, duration: 800.ms),
                        
                        const SizedBox(height: 50),
                        
                        // حقل البريد
                        _buildInputField(
                          controller: _emailController,
                          label: 'البريد الإلكتروني',
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                        ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.3, end: 0, duration: 600.ms),
                        
                        const SizedBox(height: 20),
                        
                        // حقل كلمة المرور
                        _buildInputField(
                          controller: _passwordController,
                          label: 'كلمة المرور',
                          icon: Icons.lock_outline,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                              color: const Color(0xFFB76E79),
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ).animate().fadeIn(delay: 500.ms).slideX(begin: 0.3, end: 0, duration: 600.ms),
                        
                        if (_errorMessage.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE74C3C).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE74C3C).withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: Color(0xFFE74C3C), size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage,
                                    style: const TextStyle(color: Color(0xFFE74C3C), fontSize: 13, fontFamily: 'Tajawal'),
                                  ),
                                ),
                              ],
                            ),
                          ).animate().shake(),
                        ],
                        
                        const SizedBox(height: 30),
                        
                        // زر الإجراء
                        _isLoading
                            ? const Center(child: CircularProgressIndicator(color: Color(0xFFB76E79)))
                            : ElevatedButton(
                                onPressed: _authenticate,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                                ),
                                child: Text(
                                  _isLogin ? 'تسجيل الدخول' : 'إنشاء حساب',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, fontFamily: 'Tajawal'),
                                ),
                              ).animate().fadeIn(delay: 600.ms).scale(duration: 600.ms, curve: Curves.elasticOut),
                        
                        const SizedBox(height: 25),
                        
                        // زر التبديل
                        Center(
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                _isLogin = !_isLogin;
                                _errorMessage = '';
                                _passwordController.clear();
                              });
                            },
                            child: Text(
                              _isLogin ? 'ليس لديك حساب؟ إنشاء حساب' : 'لديك حساب؟ تسجيل الدخول',
                              style: const TextStyle(
                                color: Color(0xFFB76E79),
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Tajawal',
                              ),
                            ),
                          ),
                        ).animate().fadeIn(delay: 700.ms),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF333333),
            fontFamily: 'Tajawal',
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.7),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.9)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFB76E79).withOpacity(0.1),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: TextField(
                controller: controller,
                keyboardType: keyboardType,
                obscureText: obscureText,
                textAlign: TextAlign.right,
                decoration: InputDecoration(
                  hintText: label,
                  hintStyle: TextStyle(color: const Color(0xFF333333).withOpacity(0.4), fontFamily: 'Tajawal'),
                  prefixIcon: Icon(icon, color: const Color(0xFFB76E79)),
                  suffixIcon: suffixIcon,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
