# AVON Digital Platform
منصة رقمية متكاملة لمركز AVON للطب التجميلي.

## 🚀 كيفية البدء
1. تأكد من تثبيت Python و Node.js و Flutter على جهازك.
2. أنشئ مشروعاً جديداً في [Supabase](https://supabase.com).
3. انسخ محتوى ملف `database/schema.sql` والصقه في SQL Editor في Supabase لتنفيذ الجداول.
4. لتطبيق الموبايل: انتقل لمجلد `mobile_app` ونفذ `flutter pub get` ثم `flutter run`.
5. للوحة الإدارة: انتقل لمجلد `admin_dashboard` ونفذ `npm install` ثم `npm run dev`.

## 🛡️ ملاحظات أمنية حرجة
- تم تفعيل Row-Level Security (RLS) في قاعدة البيانات.
- يمنع تماماً الاعتماد على Frontend لمنع الحجز المزدوج. يجب استخدام `SELECT ... FOR UPDATE` في الـ Backend.
- جميع المبالغ المالية تستخدم نوع `DECIMAL` لمنع أخطاء التقريب.
