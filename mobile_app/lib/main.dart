import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/booking/booking_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp])
      .then((_) => runApp(const AVONApp()));
}

class AVONApp extends StatelessWidget {
  const AVONApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AVON Luxury Center',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF8F4F0),
        primaryColor: const Color(0xFFB76E79),
        fontFamily: 'Tajawal',
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFB76E79),
          secondary: Color(0xFFE8B4B8),
          surface: Color(0xFFF8F4F0),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFB76E79),
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 32),
          ),
        ),
      ),
      locale: const Locale('ar', 'IQ'),
      builder: (context, child) {
        return Directionality(textDirection: TextDirection.rtl, child: child!);
      },
      home: const SplashScreen(),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/bookings': (context) => const BookingScreen(serviceName: ''),
      },
    );
  }
}
