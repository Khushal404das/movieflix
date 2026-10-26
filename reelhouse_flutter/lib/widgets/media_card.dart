import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class MediaCard extends StatelessWidget {
  final MediaItem item;
  final VoidCallback? onTap;
  final double? width;

  const MediaCard({super.key, required this.item, this.onTap, this.width});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: AppTheme.card,
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Poster(url: item.posterUrl),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (item.year.isNotEmpty) ...[
                        Text(item.year,
                            style: const TextStyle(
                                color: AppTheme.textMuted, fontSize: 11)),
                        const SizedBox(width: 6),
                      ],
                      if (item.voteAverage > 0) ...[
                        const Icon(Icons.star_rounded,
                            size: 12, color: Color(0xFFF5C518)),
                        const SizedBox(width: 2),
                        Text(item.ratingStr,
                            style: const TextStyle(
                                color: AppTheme.textMuted, fontSize: 11)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  final String url;
  const _Poster({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return AspectRatio(
        aspectRatio: 2 / 3,
        child: Container(
          color: AppTheme.shimmerBase,
          child: const Icon(Icons.movie_rounded,
              color: AppTheme.textMuted, size: 40),
        ),
      );
    }
    return AspectRatio(
      aspectRatio: 2 / 3,
      child: CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (_, __) => Shimmer.fromColors(
          baseColor: AppTheme.shimmerBase,
          highlightColor: AppTheme.shimmerHigh,
          child: Container(color: AppTheme.shimmerBase),
        ),
        errorWidget: (_, __, ___) => Container(
          color: AppTheme.shimmerBase,
          child: const Icon(Icons.broken_image_rounded,
              color: AppTheme.textMuted),
        ),
      ),
    );
  }
}

// Horizontal card (wider, for rows)
class MediaCardHorizontal extends StatelessWidget {
  final MediaItem item;
  final VoidCallback? onTap;

  const MediaCardHorizontal({super.key, required this.item, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: AppTheme.card,
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Poster(url: item.posterUrl),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
              child: Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
