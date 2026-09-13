import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:math';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Particle> _particles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );
    
    for (int i = 0; i < 20; i++) {
      _particles.add(Particle(
        x: _random.nextDouble() * 400,
        y: _random.nextDouble() * 800,
        size: _random.nextDouble() * 4 + 2,
        speed: _random.nextDouble() * 2 + 1,
        color: [
          const Color(0xFFE8B4B8),
          const Color(0xFFB76E79),
          const Color(0xFFFFD4C4),
          const Color(0xFFE6E6FA),
        ][_random.nextInt(4)],
      ));
    }

    _controller.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFF8F4F0),
                  Color(0xFFFFD4C4),
                  Color(0xFFE8B4B8),
                ],
              ),
            ),
            child: Stack(
              children: [
                ..._particles.map((particle) {
                  final offset = (_controller.value * particle.speed * 100);
                  return Positioned(
                    left: particle.x,
                    top: (particle.y - offset) % 800,
                    child: Container(
                      width: particle.size,
                      height: particle.size,
                      decoration: BoxDecoration(
                        color: particle.color.withOpacity(0.6),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: particle.color.withOpacity(0.4),
                            blurRadius: particle.size * 2,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
                
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 1500),
                        curve: Curves.elasticOut,
                        transform: Matrix4.identity()
                          ..setEntry(3, 2, 0.001)
                          ..rotateY(_controller.value * 2 * pi),
                        child: Container(
                          width: 150 * _controller.value + 50,
                          height: 150 * _controller.value + 50,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFB76E79).withOpacity(0.4),
                                blurRadius: 40 * _controller.value,
                                spreadRadius: 10 * _controller.value,
                              ),
                            ],
                            gradient: RadialGradient(
                              colors: [
                                Colors.white,
                                const Color(0xFFE8B4B8).withOpacity(0.5),
                              ],
                            ),
                          ),
                          child: Icon(
                            Icons.auto_awesome,
                            size: 70 * _controller.value,
                            color: const Color(0xFFB76E79),
                          ),
                        ),
                      ).animate().fadeIn(duration: 1.seconds).then().scale(duration: 800.ms, curve: Curves.elasticOut),
                      
                      const SizedBox(height: 40),
                      
                      Text(
                        'AVON',
                        style: TextStyle(
                          fontSize: 56,
                          fontWeight: FontWeight.w300,
                          color: const Color(0xFFB76E79),
                          letterSpacing: 12,
                          fontFamily: 'Tajawal',
                          shadows: [
                            Shadow(
                              color: const Color(0xFFB76E79).withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 500.ms, duration: 800.ms).slideY(begin: 0.5, end: 0),
                      
                      const SizedBox(height: 16),
                      
                      Text(
                        'Luxury Beauty Center',
                        style: TextStyle(
                          fontSize: 16,
                          color: const Color(0xFFB76E79).withOpacity(0.7),
                          letterSpacing: 4,
                          fontFamily: 'Tajawal',
                          fontWeight: FontWeight.w400,
                        ),
                      ).animate().fadeIn(delay: 800.ms, duration: 800.ms),
                      
                      const SizedBox(height: 60),
                      
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 1500),
                        width: 200 * _controller.value,
                        height: 2,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFFB76E79),
                              Color(0xFFFFD4C4),
                              Color(0xFFE8B4B8),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class Particle {
  final double x;
  final double y;
  final double size;
  final double speed;
  final Color color;

  Particle({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.color,
  });
}
