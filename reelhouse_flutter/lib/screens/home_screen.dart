import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../models/media_item.dart';
import '../services/tmdb_service.dart';
import '../theme/app_theme.dart';
import '../widgets/media_card.dart';
import 'detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<MediaItem> _trending   = [];
  List<MediaItem> _popular    = [];
  List<MediaItem> _topRated   = [];
  List<MediaItem> _nowPlaying = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        TmdbService.getTrending(),
        TmdbService.getList('movie', 'popular'),
        TmdbService.getList('movie', 'top_rated'),
        TmdbService.getList('movie', 'now_playing'),
      ]);
      if (mounted) {
        setState(() {
          _trending   = results[0];
          _popular    = results[1];
          _topRated   = results[2];
          _nowPlaying = results[3];
          _loading    = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    final hero = _trending.isNotEmpty ? _trending.first : null;

    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.surface,
      onRefresh: _load,
      child: CustomScrollView(
        slivers: [
          // Logo AppBar (properly inset below mobile status bar)
          SliverAppBar(
            backgroundColor: AppTheme.background,
            floating: true,
            snap: true,
            pinned: false,
            elevation: 0,
            automaticallyImplyLeading: false,
            title: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/images/logo.png',
                    height: 36,
                    width: 36,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'MovieFlix',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppTheme.primary.withValues(alpha: 0.5)),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Hero Banner
          if (hero != null)
            SliverToBoxAdapter(child: _HeroBanner(item: hero)),

          // Trending
          const _SectionHeader(title: '🔥 Trending'),
          _MediaRow(items: _trending.skip(1).take(12).toList()),

          // Now Playing
          const _SectionHeader(title: '🎬 Now Playing'),
          _MediaRow(items: _nowPlaying.take(12).toList()),

          // Popular
          const _SectionHeader(title: '🌟 Popular Movies'),
          _MediaRow(items: _popular.take(12).toList()),

          // Top Rated
          const _SectionHeader(title: '⭐ Top Rated'),
          _MediaRow(items: _topRated.take(12).toList()),

          const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
        ],
      ),
    );
  }
}

// ── Hero Banner ──────────────────────────────────────────────────────────────

class _HeroBanner extends StatelessWidget {
  final MediaItem item;
  const _HeroBanner({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => DetailScreen(item: item))),
      child: SizedBox(
        height: 480,
        child: Stack(
          children: [
            if (item.backdropUrl.isNotEmpty)
              Positioned.fill(
                child: CachedNetworkImage(
                  imageUrl: item.backdropUrl,
                  fit: BoxFit.cover,
                ),
              ),
            // gradient overlay
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      AppTheme.background.withValues(alpha: 0.3),
                      AppTheme.background.withValues(alpha: 0.85),
                      AppTheme.background,
                    ],
                    stops: const [0.0, 0.4, 0.75, 1.0],
                  ),
                ),
              ),
            ),
            // content
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // tag
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.mediaType.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (item.year.isNotEmpty) ...[
                          Text(item.year,
                              style: const TextStyle(
                                  color: AppTheme.textSecondary, fontSize: 13)),
                          const SizedBox(width: 10),
                        ],
                        const Icon(Icons.star_rounded,
                            size: 14, color: Color(0xFFF5C518)),
                        const SizedBox(width: 4),
                        Text(item.ratingStr,
                            style: const TextStyle(
                                color: AppTheme.textSecondary, fontSize: 13)),
                      ],
                    ),
                    if (item.overview != null && item.overview!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        item.overview!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _HeroButton(
                          icon: Icons.play_arrow_rounded,
                          label: 'Watch Now',
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(builder: (_) => DetailScreen(item: item))),
                          filled: true,
                        ),
                        const SizedBox(width: 10),
                        _HeroButton(
                          icon: Icons.info_outline_rounded,
                          label: 'More Info',
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(builder: (_) => DetailScreen(item: item))),
                          filled: false,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool filled;
  const _HeroButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.filled,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: filled ? AppTheme.primary : Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
          border: filled ? null : Border.all(color: Colors.white24),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: Colors.white),
            const SizedBox(width: 6),
            Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14)),
          ],
        ),
      ),
    );
  }
}

// ── Section Header ───────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
        child: Text(
          title,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

// ── Horizontal media row ──────────────────────────────────────────────────────

class _MediaRow extends StatelessWidget {
  final List<MediaItem> items;
  const _MediaRow({required this.items});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 215,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: items.length,
          itemBuilder: (ctx, i) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: MediaCardHorizontal(
              item: items[i],
              onTap: () => Navigator.push(ctx,
                  MaterialPageRoute(builder: (_) => DetailScreen(item: items[i]))),
            ),
          ),
        ),
      ),
    );
  }
}
