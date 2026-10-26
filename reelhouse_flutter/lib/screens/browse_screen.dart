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
  String _selectedGenre = '';
  String _sort = 'popularity.desc';
  List<Genre> _movieGenres = [];
  List<Genre> _tvGenres = [];
  List<MediaItem> _items = [];
  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;

  final _sorts = const [
    ('popularity.desc',            'Most Popular'),
    ('vote_average.desc',          'Highest Rated'),
    ('primary_release_date.desc',  'Newest'),
  ];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(_onTabChange);
    _loadGenres();
    _load();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  String get _type => _tab.index == 0 ? 'movie' : 'tv';

  void _onTabChange() {
    if (_tab.indexIsChanging) {
      setState(() { _selectedGenre = ''; _page = 1; });
      _load();
    }
  }

  Future<void> _loadGenres() async {
    final mg = await TmdbService.getGenres('movie');
    final tg = await TmdbService.getGenres('tv');
    if (mounted) setState(() { _movieGenres = mg; _tvGenres = tg; });
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await TmdbService.discover(
        type: _type, genre: _selectedGenre, page: _page, sort: _sort);
      if (mounted) {
        setState(() {
          _items = res['results'] as List<MediaItem>;
          _totalPages = res['total_pages'] as int;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final genres = _tab.index == 0 ? _movieGenres : _tvGenres;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        title: const Text('Browse',
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
            onSelected: (v) { setState(() { _sort = v; _page = 1; }); _load(); },
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
          // Genre chips
          if (genres.isNotEmpty)
            SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  _GenreChip(label: 'All', selected: _selectedGenre.isEmpty,
                      onTap: () { setState(() { _selectedGenre = ''; _page = 1; }); _load(); }),
                  ...genres.map((g) => _GenreChip(
                    label: g.name,
                    selected: _selectedGenre == g.id.toString(),
                    onTap: () {
                      setState(() { _selectedGenre = g.id.toString(); _page = 1; });
                      _load();
                    },
                  )),
                ],
              ),
            ),

          // Grid
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : RefreshIndicator(
                    color: AppTheme.primary,
                    backgroundColor: AppTheme.surface,
                    onRefresh: _load,
                    child: GridView.builder(
                      padding: const EdgeInsets.all(10),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 0.55,
                      ),
                      itemCount: _items.length,
                      itemBuilder: (ctx, i) => MediaCard(
                        item: _items[i],
                        onTap: () => Navigator.push(ctx,
                            MaterialPageRoute(builder: (_) =>
                                DetailScreen(item: _items[i]))),
                      ),
                    ),
                  ),
          ),

          // Pagination
          if (_totalPages > 1)
            Container(
              color: AppTheme.surface,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _page > 1
                        ? () { setState(() => _page--); _load(); }
                        : null,
                    child: const Text('← Prev',
                        style: TextStyle(color: AppTheme.primary)),
                  ),
                  Text('$_page / $_totalPages',
                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                  TextButton(
                    onPressed: _page < _totalPages
                        ? () { setState(() => _page++); _load(); }
                        : null,
                    child: const Text('Next →',
                        style: TextStyle(color: AppTheme.primary)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _GenreChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _GenreChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : AppTheme.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.divider),
        ),
        child: Text(label,
            style: TextStyle(
                color: selected ? Colors.white : AppTheme.textSecondary,
                fontSize: 12,
                fontWeight:
                    selected ? FontWeight.w700 : FontWeight.w400)),
      ),
    );
  }
}
