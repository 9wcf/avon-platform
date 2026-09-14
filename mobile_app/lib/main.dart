import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:async';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/booking/booking_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('ar', null);
  await dotenv.load(fileName: ".env");
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp])
      .then((_) => runApp(const AVONApp()));
}

class AVONApp extends StatefulWidget {
  const AVONApp({super.key});
  @override
  State<AVONApp> createState() => _AVONAppState();
}

class _AVONAppState extends State<AVONApp> {
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _setup(Supabase.instance.client.auth.currentSession?.user.id);
    Supabase.instance.client.auth.onAuthStateChange.listen((state) {
      _setup(state.session?.user.id);
    });
  }

  void _setup(String? uid) {
    _channel?.unsubscribe();
    _channel = null;
    if (uid == null) return;
    _channel = Supabase.instance.client
        .channel('notif_$uid')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'user_id', value: uid),
          callback: (payload) {
            final row = Map<String, dynamic>.from(payload.newRecord);
            _alert(row);
          },
        )
        .subscribe();
  }

  void _alert(Map<String, dynamic> row) {
    final ctx = navigatorKey.currentContext;
    if (ctx == null) return;
    final type = (row['type'] ?? 'info').toString();
    final color = type == 'approved'
        ? const Color(0xFF2E7D32)
        : type == 'rejected'
            ? const Color(0xFFC62828)
            : const Color(0xFFB76E79);
    final icon = type == 'approved' ? Icons.check_circle : type == 'rejected' ? Icons.error : Icons.notifications;
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 8),
            Expanded(child: Text((row['title'] ?? 'إشعار').toString(), style: const TextStyle(fontFamily: 'Tajawal', fontSize: 16, fontWeight: FontWeight.w800))),
          ],
        ),
        content: Text((row['body'] ?? '').toString(), style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
            child: const Text('حسناً', style: TextStyle(color: Color(0xFFB76E79), fontFamily: 'Tajawal')),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
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

class _SplashWrapper extends StatefulWidget {
  const _SplashWrapper();
  @override
  State<_SplashWrapper> createState() => _SplashWrapperState();
}

class _SplashWrapperState extends State<_SplashWrapper> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => const SplashScreen();
}
