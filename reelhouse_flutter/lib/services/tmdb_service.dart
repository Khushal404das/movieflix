import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/media_item.dart';

class TmdbService {
  static const _baseUrl = 'https://api.themoviedb.org/3';
  static const _apiKey  = '844dba0bfd8f3a4f3799f6130ef9e335';

  static Future<Map<String, dynamic>> _get(String path,
      [Map<String, String>? params]) async {
    final uri = Uri.parse('$_baseUrl$path').replace(queryParameters: {
      'api_key': _apiKey,
      'language': 'en-US',
      ...?params,
    });
    final res = await http.get(uri).timeout(const Duration(seconds: 15));
    if (res.statusCode != 200) throw Exception('TMDB error \${res.statusCode}');
    return json.decode(res.body) as Map<String, dynamic>;
  }

  // ── Trending ──────────────────────────────────────────────────────────────
  static Future<List<MediaItem>> getTrending({String type = 'all'}) async {
    final d = await _get('/trending/$type/week');
    return (d['results'] as List)
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Discover with OTT Platform Support ─────────────────────────────────────
  static Future<Map<String, dynamic>> discover({
    String type = 'movie',
    String genre = '',
    int page = 1,
    String sort = 'popularity.desc',
    String ott = '',
  }) async {
    final params = <String, String>{
      'page': '$page',
      'sort_by': sort,
    };
    if (genre.isNotEmpty && genre != 'all') params['with_genres'] = genre;
    if (ott.isNotEmpty && ott != 'all') {
      params['with_watch_providers'] = ott;
      params['watch_region'] = 'US';
    }
    final d = await _get('/discover/$type', params);
    final items = (d['results'] as List)
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>, type: type))
        .toList();
    return {'results': items, 'total_pages': d['total_pages'] ?? 1};
  }

  // ── Search ────────────────────────────────────────────────────────────────
  static Future<List<MediaItem>> search(String query) async {
    if (query.trim().isEmpty) return [];
    final d = await _get('/search/multi', {'query': query, 'page': '1'});
    return (d['results'] as List)
        .where((e) => (e['media_type'] == 'movie' || e['media_type'] == 'tv'))
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Genres ────────────────────────────────────────────────────────────────
  static Future<List<Genre>> getGenres(String type) async {
    final d = await _get('/genre/$type/list');
    return (d['genres'] as List)
        .map((e) => Genre.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getDetail(String type, int id) async {
    return _get('/$type/$id', {
      'append_to_response': 'videos,credits,similar,recommendations',
    });
  }

  // ── Now Playing / Top Rated / Popular ─────────────────────────────────────
  static Future<List<MediaItem>> getList(String type, String list,
      {int page = 1}) async {
    final d = await _get('/$type/$list', {'page': '$page'});
    return (d['results'] as List)
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>, type: type))
        .toList();
  }
}
