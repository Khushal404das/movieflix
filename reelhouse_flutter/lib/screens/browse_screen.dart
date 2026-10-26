import 'package:flutter/material.dart';
import '../models/media_item.dart';
import '../services/tmdb_service.dart';
import '../theme/app_theme.dart';
import '../widgets/media_card.dart';
import 'detail_screen.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});
  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  final ScrollController _scrollController = ScrollController();

  String _selectedOtt = 'all';
  String _selectedGenre = '';
  String _sort = 'popularity.desc';
  List<Genre> _movieGenres = [];
  List<Genre> _tvGenres = [];
  List<MediaItem> _items = [];
  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;
  bool _loadingMore = false;

  final _ottPlatforms = const [
    ('all', '🌟 All Platforms'),
    ('8', 'Netflix'),
    ('337', 'Disney+'),
    ('9', 'Prime Video'),
    ('350', 'Apple TV+'),
    ('283', 'Crunchyroll (Anime)'),
    ('1899', 'Max'),
    ('2303', 'Paramount+'),
    ('15', 'Hulu'),
    ('34', 'MGM+'),
    ('387', 'Peacock'),
  ];

  final _sorts = const [
    ('popularity.desc',           'Most Popular'),
    ('vote_average.desc',         'Highest Rated'),
    ('primary_release_date.desc', 'Newest'),
  ];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(_onTabChange);
    _scrollController.addListener(_onScroll);
    _loadGenres();
    _load(reset: true);
  }

  @override
  void dispose() {
    _tab.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String get _type => _tab.index == 0 ? 'movie' : 'tv';

  void _onTabChange() {
    if (_tab.indexIsChanging) {
      setState(() {
        _selectedGenre = '';
        _page = 1;
      });
      _load(reset: true);
    }
  }

  void _onScroll() {
    if (_scrollController.hasClients) {
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      // Pre-fetch next page 350px before reaching bottom
      if (maxScroll - currentScroll <= 350) {
        if (!_loading && !_loadingMore && _page < _totalPages) {
          _loadMore();
        }
      }
    }
  }

  Future<void> _loadGenres() async {
    final mg = await TmdbService.getGenres('movie');
    final tg = await TmdbService.getGenres('tv');
    if (mounted) setState(() { _movieGenres = mg; _tvGenres = tg; });
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _page = 1;
      });
    }
    try {
      final res = await TmdbService.discover(
        type: _type,
        genre: _selectedGenre,
        page: 1,
        sort: _sort,
        ott: _selectedOtt == 'all' ? '' : _selectedOtt,
      );
      if (mounted) {
        setState(() {
          _items = res['results'] as List<MediaItem>;
          _totalPages = res['total_pages'] as int;
          _page = 1;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _page >= _totalPages) return;
    setState(() => _loadingMore = true);
    final nextPage = _page + 1;

    try {
      final res = await TmdbService.discover(
        type: _type,
        genre: _selectedGenre,
        page: nextPage,
        sort: _sort,
        ott: _selectedOtt == 'all' ? '' : _selectedOtt,
      );
      final newItems = res['results'] as List<MediaItem>;
      if (mounted) {
        setState(() {
          _page = nextPage;
          _totalPages = res['total_pages'] as int;
          // Deduplicate by ID
          final existingIds = _items.map((i) => '${i.mediaType}-${i.id}').toSet();
          for (final item in newItems) {
            if (!existingIds.contains('${item.mediaType}-${item.id}')) {
              _items.add(item);
            }
          }
          _loadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final genres = _tab.index == 0 ? _movieGenres : _tvGenres;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        title: const Text('Browse Catalog',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20)),
        bottom: TabBar(
          controller: _tab,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          labelColor: AppTheme.textPrimary,
          unselectedLabelColor: AppTheme.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Movies'), Tab(text: 'TV Shows')],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort_rounded, color: AppTheme.textSecondary),
            color: AppTheme.surface,
            onSelected: (v) {
              setState(() { _sort = v; });
              _load(reset: true);
            },
            itemBuilder: (_) => _sorts
                .map((s) => PopupMenuItem(
                      value: s.$1,
                      child: Text(s.$2,
                          style: TextStyle(
                              color: _sort == s.$1
                                  ? AppTheme.primary
                                  : AppTheme.textPrimary)),
                    ))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── OTT Platforms Selector Row ──
          Container(
            height: 48,
            color: const Color(0xFF141414),
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              children: _ottPlatforms.map((p) => _FilterPill(
                label: p.$2,
                selected: _selectedOtt == p.$1,
                accentColor: AppTheme.primary,
                onTap: () {
                  if (_selectedOtt != p.$1) {
                    setState(() => _selectedOtt = p.$1);
                    _load(reset: true);
                  }
                },
              )).toList(),
            ),
          ),

          // ── Genre Chips Row ──
          if (genres.isNotEmpty)
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                children: [
                  _FilterPill(
                    label: 'All Genres',
                    selected: _selectedGenre.isEmpty,
                    onTap: () {
                      if (_selectedGenre.isNotEmpty) {
                        setState(() => _selectedGenre = '');
                        _load(reset: true);
                      }
                    },
                  ),
                  ...genres.map((g) => _FilterPill(
                    label: g.name,
                    selected: _selectedGenre == g.id.toString(),
                    onTap: () {
                      setState(() => _selectedGenre = g.id.toString());
                      _load(reset: true);
                    },
                  )),
                ],
              ),
            ),

          // ── Infinite Scroll Grid ──
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : RefreshIndicator(
                    color: AppTheme.primary,
                    backgroundColor: AppTheme.surface,
                    onRefresh: () => _load(reset: true),
                    child: CustomScrollView(
                      controller: _scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverPadding(
                          padding: const EdgeInsets.all(10),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                              childAspectRatio: 0.55,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (ctx, i) => MediaCard(
                                item: _items[i],
                                onTap: () => Navigator.push(
                                  ctx,
                                  MaterialPageRoute(
                                    builder: (_) => DetailScreen(item: _items[i]),
                                  ),
                                ),
                              ),
                              childCount: _items.length,
                            ),
                          ),
                        ),

                        // Bottom Spinner on Infinite Scroll
                        if (_loadingMore)
                          const SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: SizedBox(
                                  width: 32,
                                  height: 32,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),

                        // Reached End Indicator
                        if (!_loadingMore && _page >= _totalPages && _items.isNotEmpty)
                          const SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  "You've reached the end",
                                  style: TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? accentColor;
  final VoidCallback onTap;
  const _FilterPill({
    required this.label,
    required this.selected,
    this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = accentColor ?? AppTheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? activeColor : const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? activeColor : Colors.white12,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }
}
