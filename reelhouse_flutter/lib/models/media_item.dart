class MediaItem {
  final int id;
  final String title;
  final String? posterPath;
  final String? backdropPath;
  final String? overview;
  final String? releaseDate;
  final double voteAverage;
  final String mediaType; // 'movie' or 'tv'

  MediaItem({
    required this.id,
    required this.title,
    this.posterPath,
    this.backdropPath,
    this.overview,
    this.releaseDate,
    required this.voteAverage,
    required this.mediaType,
  });

  String get posterUrl => posterPath != null
      ? 'https://image.tmdb.org/t/p/w500$posterPath'
      : '';

  String get backdropUrl => backdropPath != null
      ? 'https://image.tmdb.org/t/p/w1280$backdropPath'
      : '';

  String get year => releaseDate != null && releaseDate!.length >= 4
      ? releaseDate!.substring(0, 4)
      : '';

  String get ratingStr => voteAverage > 0
      ? voteAverage.toStringAsFixed(1)
      : 'N/A';

  factory MediaItem.fromJson(Map<String, dynamic> json, {String type = 'movie'}) {
    final mediaType = json['media_type'] as String? ?? type;
    return MediaItem(
      id: json['id'] as int,
      title: (json['title'] ?? json['name'] ?? '') as String,
      posterPath: json['poster_path'] as String?,
      backdropPath: json['backdrop_path'] as String?,
      overview: json['overview'] as String?,
      releaseDate: (json['release_date'] ?? json['first_air_date']) as String?,
      voteAverage: ((json['vote_average'] ?? 0) as num).toDouble(),
      mediaType: mediaType,
    );
  }
}

class Genre {
  final int id;
  final String name;
  Genre({required this.id, required this.name});
  factory Genre.fromJson(Map<String, dynamic> j) =>
      Genre(id: j['id'] as int, name: j['name'] as String);
}
