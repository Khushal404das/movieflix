import 'package:flutter/material.dart';
import '../models/media_item.dart';
import '../services/tmdb_service.dart';
import '../theme/app_theme.dart';
import '../widgets/media_card.dart';
import 'detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  List<MediaItem> _results = [];
  bool _loading = false;
  String _last = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search(String q) async {
    if (q == _last) return;
    _last = q;
    if (q.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }
    setState(() => _loading = true);
    try {
      final r = await TmdbService.search(q);
      if (mounted && _last == q) setState(() { _results = r; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          onChanged: (v) => Future.delayed(
              const Duration(milliseconds: 400), () => _search(v)),
          style: const TextStyle(color: AppTheme.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search movies, shows...',
            hintStyle: const TextStyle(color: AppTheme.textMuted),
            border: InputBorder.none,
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: AppTheme.textMuted),
                    onPressed: () {
                      _controller.clear();
                      setState(() => _results = []);
                    },
                  )
                : null,
          ),
        ),
        backgroundColor: AppTheme.surface,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _results.isEmpty && _last.isNotEmpty
              ? const Center(
                  child: Text('No results found',
                      style: TextStyle(color: AppTheme.textSecondary)))
              : _results.isEmpty
                  ? _EmptySearchHint()
                  : GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 0.56,
                      ),
                      itemCount: _results.length,
                      itemBuilder: (ctx, i) => MediaCard(
                        item: _results[i],
                        onTap: () => Navigator.push(ctx,
                            MaterialPageRoute(builder: (_) =>
                                DetailScreen(item: _results[i]))),
                      ),
                    ),
    );
  }
}

class _EmptySearchHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.search_rounded,
              size: 64, color: AppTheme.textMuted.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          const Text('Search for your favourite movies & shows',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}
