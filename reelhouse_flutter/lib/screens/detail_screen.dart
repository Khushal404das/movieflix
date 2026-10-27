import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'player_screen.dart';
import '../models/media_item.dart';
import '../services/tmdb_service.dart';
import '../theme/app_theme.dart';
import '../widgets/media_card.dart';

class DetailScreen extends StatefulWidget {
  final MediaItem item;
  const DetailScreen({super.key, required this.item});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await TmdbService.getDetail(
          widget.item.mediaType, widget.item.id);
      if (mounted) setState(() { _detail = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<MediaItem> get _similar {
    final raw = (_detail?['similar']?['results'] ??
        _detail?['recommendations']?['results'] ?? []) as List;
    return raw
        .take(12)
        .map((e) => MediaItem.fromJson(
            e as Map<String, dynamic>, type: widget.item.mediaType))
        .toList();
  }

  String? get _trailerKey {
    final vids = (_detail?['videos']?['results'] ?? []) as List;
    final trailer = vids.firstWhere(
      (v) => v['type'] == 'Trailer' && v['site'] == 'YouTube',
      orElse: () => null,
    );
    return trailer?['key'] as String?;
  }

  String get _genres {
    final gs = (_detail?['genres'] ?? []) as List;
    return gs.map((g) => g['name']).join(' • ');
  }

  String get _runtime {
    final rt = _detail?['runtime'] as int?;
    if (rt == null || rt == 0) return '';
    final h = rt ~/ 60;
    final m = rt % 60;
    return h > 0 ? '${h}h ${m}m' : '${m}m';
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // Backdrop SliverAppBar
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: AppTheme.background,
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.backdropUrl.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: item.backdropUrl,
                      fit: BoxFit.cover,
                    )
                  else
                    Container(color: AppTheme.card),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppTheme.background],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Poster + title row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: item.posterUrl,
                          width: 100,
                          height: 150,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => Container(
                            width: 100, height: 150,
                            color: AppTheme.card,
                            child: const Icon(Icons.movie_rounded,
                                color: AppTheme.textMuted),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                height: 1.15,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              children: [
                                if (item.year.isNotEmpty)
                                  _Tag(item.year),
                                if (_runtime.isNotEmpty)
                                  _Tag(_runtime),
                                _Tag(item.mediaType == 'tv' ? 'TV' : 'Movie'),
                              ],
                            ),
                            if (item.voteAverage > 0) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded,
                                      size: 16, color: Color(0xFFF5C518)),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${item.ratingStr} / 10',
                                    style: const TextStyle(
                                      color: AppTheme.textSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => _openStream(context),
                          icon: const Icon(Icons.play_arrow_rounded, size: 20),
                          label: const Text('Watch Now',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                      if (_trailerKey != null) ...[
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white24),
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => _openTrailer(),
                          icon: const Icon(Icons.play_circle_outline_rounded, size: 18),
                          label: const Text('Trailer'),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Genres
                  if (_genres.isNotEmpty)
                    Text(_genres,
                        style: const TextStyle(
                            color: AppTheme.textSecondary, fontSize: 12)),

                  const SizedBox(height: 16),

                  // Overview
                  if (item.overview != null && item.overview!.isNotEmpty) ...[
                    const Text('Overview',
                        style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Text(
                      item.overview!,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                        height: 1.6,
                      ),
                    ),
                  ],

                  // Cast
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                    )
                  else if (_detail != null) ...[
                    const SizedBox(height: 24),
                    _CastRow(credits: _detail!['credits']),
                  ],
                ],
              ),
            ),
          ),

          // Similar
          if (_similar.isNotEmpty) ...[
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Text('Similar Titles',
                    style: TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700)),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 215,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _similar.length,
                  itemBuilder: (ctx, i) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: MediaCardHorizontal(
                      item: _similar[i],
                      onTap: () => Navigator.pushReplacement(ctx,
                          MaterialPageRoute(builder: (_) =>
                              DetailScreen(item: _similar[i]))),
                    ),
                  ),
                ),
              ),
            ),
          ],

          const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
        ],
      ),
    );
  }

  void _openStream(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PlayerScreen(item: widget.item),
      ),
    );
  }

  void _openTrailer() {
    if (_trailerKey == null) return;
    launchUrl(
      Uri.parse('https://www.youtube.com/watch?v=$_trailerKey'),
      mode: LaunchMode.externalApplication,
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  const _Tag(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Text(text,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
    );
  }
}

class _CastRow extends StatelessWidget {
  final Map<String, dynamic>? credits;
  const _CastRow({this.credits});

  @override
  Widget build(BuildContext context) {
    if (credits == null) return const SizedBox.shrink();
    final cast = (credits!['cast'] as List?)?.take(10).toList() ?? [];
    if (cast.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Cast',
            style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: cast.length,
            itemBuilder: (_, i) {
              final c = cast[i] as Map<String, dynamic>;
              final img = c['profile_path'] as String?;
              return Container(
                width: 68,
                margin: const EdgeInsets.only(right: 10),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppTheme.card,
                      backgroundImage: img != null
                          ? CachedNetworkImageProvider(
                              'https://image.tmdb.org/t/p/w200$img')
                          : null,
                      child: img == null
                          ? const Icon(Icons.person_rounded,
                              color: AppTheme.textMuted)
                          : null,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      c['name'] as String? ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: AppTheme.textSecondary, fontSize: 10),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
