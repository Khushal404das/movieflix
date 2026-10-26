import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('My Watchlist',
            style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppTheme.surface,
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bookmark_outline_rounded,
                size: 72, color: AppTheme.textMuted.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            const Text('Your watchlist is empty',
                style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text('Add titles you want to watch later.',
                style: TextStyle(
                    color: AppTheme.textMuted, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
