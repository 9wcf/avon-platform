import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class RatingDialog extends StatefulWidget {
  final String serviceName;
  final Function(double, String) onSubmit;

  const RatingDialog({
    super.key,
    required this.serviceName,
    required this.onSubmit,
  });

  @override
  State<RatingDialog> createState() => _RatingDialogState();
}

class _RatingDialogState extends State<RatingDialog> {
  double _rating = 0;
  final TextEditingController _commentController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.95),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFE8B4B8), Color(0xFFB76E79)],
                ),
              ),
              child: const Icon(Icons.star, color: Colors.white, size: 35),
            ),
            const SizedBox(height: 20),
            const Text(
              'قيّمي تجربتك',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF333333),
                fontFamily: 'Tajawal',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'كيف كانت تجربتك مع ${widget.serviceName}؟',
              style: TextStyle(
                fontSize: 14,
                color: const Color(0xFF333333).withOpacity(0.6),
                fontFamily: 'Tajawal',
              ),
            ),
            const SizedBox(height: 24),
            
            // النجوم
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return GestureDetector(
                  onTap: () => setState(() => _rating = index + 1.0),
                  child: Icon(
                    Icons.star,
                    size: 40,
                    color: index < _rating ? const Color(0xFFB76E79) : const Color(0xFFE8B4B8).withOpacity(0.3),
                  ),
                );
              }),
            ),
            
            const SizedBox(height: 24),
            
            // التعليق
            TextField(
              controller: _commentController,
              maxLines: 3,
              textAlign: TextAlign.right,
              decoration: InputDecoration(
                hintText: 'اكتبي تعليقك (اختياري)',
                hintStyle: TextStyle(
                  color: const Color(0xFF333333).withOpacity(0.4),
                  fontFamily: 'Tajawal',
                ),
                filled: true,
                fillColor: const Color(0xFFF8F4F0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // الأزرار
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'لاحقاً',
                      style: TextStyle(
                        color: Color(0xFF333333),
                        fontSize: 14,
                        fontFamily: 'Tajawal',
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _rating > 0 ? () {
                      widget.onSubmit(_rating, _commentController.text);
                      Navigator.pop(context);
                    } : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB76E79),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'إرسال',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Tajawal',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
