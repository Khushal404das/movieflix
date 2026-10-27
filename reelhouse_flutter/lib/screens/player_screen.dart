import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class PlayerServer {
  final String name;
  final String shortName;
  final String Function(String type, int id, int s, int e) getUrl;

  const PlayerServer({
    required this.name,
    required this.shortName,
    required this.getUrl,
  });
}

class PlayerScreen extends StatefulWidget {
  final MediaItem item;
  final int? season;
  final int? episode;

  const PlayerScreen({
    super.key,
    required this.item,
    this.season,
    this.episode,
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  int _loadProgress = 0;
  int _currentServerIndex = 0;
  bool _showControls = true;
  Timer? _hideControlsTimer;

  static final List<PlayerServer> _servers = [
    PlayerServer(
      name: 'MovieFlix Official Web Player',
      shortName: 'MovieFlix Web',
      getUrl: (type, id, s, e) {
        if (type == 'tv') {
          return 'https://movieflix.movie-flix.workers.dev/tv/$id?season=$s&episode=$e&cinema=1';
        }
        return 'https://movieflix.movie-flix.workers.dev/movie/$id?cinema=1';
      },
    ),
    PlayerServer(
      name: 'Orion (Vidbolt Pro • Multi-Audio)',
      shortName: 'Orion / Vidbolt',
      getUrl: (type, id, s, e) {
        if (type == 'tv') {
          return 'https://vidbolt.pro/tv/$id/$s/$e?theme=e50914&autoPlay=true&mobileSheets=true';
        }
        return 'https://vidbolt.pro/movie/$id?theme=e50914&autoPlay=true&mobileSheets=true';
      },
    ),
    PlayerServer(
      name: 'VidSrc Pro',
      shortName: 'VidSrc Pro',
      getUrl: (type, id, s, e) {
        if (type == 'tv') {
          return 'https://vidsrc.to/embed/tv/$id/$s/$e';
        }
        return 'https://vidsrc.to/embed/movie/$id';
      },
    ),
    PlayerServer(
      name: 'VidSrc Me',
      shortName: 'VidSrc Me',
      getUrl: (type, id, s, e) {
        if (type == 'tv') {
          return 'https://vidsrc.me/embed/tv?tmdb=$id&season=$s&episode=$e';
        }
        return 'https://vidsrc.me/embed/movie?tmdb=$id';
      },
    ),
    PlayerServer(
      name: 'SuperEmbed',
      shortName: 'SuperEmbed',
      getUrl: (type, id, s, e) {
        if (type == 'tv') {
          return 'https://multiembed.mov/?tmdb=1&video_id=$id&s=$s&e=$e';
        }
        return 'https://multiembed.mov/?tmdb=1&video_id=$id';
      },
    ),
  ];

  @override
  void initState() {
    super.initState();
    // 1. Force landscape (horizontal) cinema orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    // 2. Immersive full-screen (hide status & navigation bars)
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    _initController();
    _startHideControlsTimer();
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    // Restore portrait orientation when leaving player
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _startHideControlsTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) {
      _startHideControlsTimer();
    }
  }

  String _buildCurrentUrl() {
    final type = widget.item.mediaType.toLowerCase();
    final id = widget.item.id;
    final season = widget.season ?? 1;
    final episode = widget.episode ?? 1;
    return _servers[_currentServerIndex].getUrl(type, id, season, episode);
  }

  String _buildWebsiteUrl() {
    final type = widget.item.mediaType.toLowerCase();
    final id = widget.item.id;
    final season = widget.season ?? 1;
    final episode = widget.episode ?? 1;
    if (type == 'tv') {
      return 'https://movieflix.movie-flix.workers.dev/tv/$id?season=$season&episode=$episode';
    }
    return 'https://movieflix.movie-flix.workers.dev/movie/$id';
  }

  void _initController() {
    final initialUrl = _buildCurrentUrl();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) {
              setState(() => _loadProgress = progress);
            }
          },
          onPageStarted: (url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasError = false;
              });
            }
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) {
              debugPrint('Main frame player error: ${error.description}');
              if (mounted) {
                setState(() {
                  _hasError = true;
                  _isLoading = false;
                });
              }
            }
          },
          onNavigationRequest: (request) {
            final url = request.url.toLowerCase();
            // Block intrusive ad redirects
            if (url.startsWith('intent:') ||
                url.startsWith('market:') ||
                url.contains('doubleclick.net') ||
                url.contains('adsterra') ||
                url.contains('bet') ||
                url.contains('crypto') ||
                url.contains('dating') ||
                url.contains('popads')) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(initialUrl));
  }

  void _switchServer(int index) {
    if (index == _currentServerIndex) return;
    setState(() {
      _currentServerIndex = index;
      _isLoading = true;
      _hasError = false;
      _loadProgress = 0;
    });
    final nextUrl = _buildCurrentUrl();
    _controller.loadRequest(Uri.parse(nextUrl));
    _startHideControlsTimer();
  }

  Future<void> _openInExternalBrowser() async {
    final siteUrl = _buildWebsiteUrl();
    final uri = Uri.parse(siteUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentServer = _servers[_currentServerIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: _toggleControls,
        child: Stack(
          children: [
            // 1. Full Landscape Video WebView
            Positioned.fill(
              child: WebViewWidget(controller: _controller),
            ),

            // 2. Loading Overlay with Official MovieFlix Logo
            if (_isLoading)
              Positioned.fill(
                child: Container(
                  color: Colors.black,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 72,
                            height: 72,
                            fit: BoxFit.contain,
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: 220,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: _loadProgress > 0 ? _loadProgress / 100 : null,
                              color: AppTheme.primary,
                              backgroundColor: Colors.white12,
                              minHeight: 4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _loadProgress > 0
                              ? 'Loading ${currentServer.shortName}... $_loadProgress%'
                              : 'Connecting to MovieFlix cinema...',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.item.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // 3. Error Overlay with Server Switch and Browser Fallback
            if (_hasError && !_isLoading)
              Positioned.fill(
                child: Container(
                  color: Colors.black.withValues(alpha: 0.95),
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            color: Colors.redAccent, size: 48),
                        const SizedBox(height: 8),
                        const Text(
                          'Playback Connection Issue',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${currentServer.name} is currently unavailable.',
                          style: const TextStyle(color: Colors.white60, fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                final next = (_currentServerIndex + 1) % _servers.length;
                                _switchServer(next);
                              },
                              icon: const Icon(Icons.swap_horiz_rounded, size: 16),
                              label: const Text('Try Another Server'),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: const BorderSide(color: Colors.white24),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: _openInExternalBrowser,
                              icon: const Icon(Icons.open_in_browser_rounded, size: 16),
                              label: const Text('Play on Website'),
                            ),
                            const SizedBox(width: 10),
                            IconButton(
                              tooltip: 'Exit to Details',
                              icon: const Icon(Icons.close_rounded, color: Colors.white70),
                              onPressed: () => Navigator.pop(context),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // 4. Floating Top Cinema Control Bar (Animated & Auto-Hiding)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              top: _showControls ? 0 : -80,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.black87, Colors.transparent],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      // Back Button (Exits landscape & returns to portrait details)
                      IconButton(
                        tooltip: 'Exit Cinema',
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 4),

                      // MovieFlix App Logo Icon
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 24,
                          height: 24,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Title & Live Cinema Badge
                      Expanded(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                widget.item.title,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'CINEMA',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Server Selector Dropdown
                      PopupMenuButton<int>(
                        tooltip: 'Switch Server',
                        initialValue: _currentServerIndex,
                        onSelected: _switchServer,
                        color: const Color(0xFF1E1E24),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.dns_rounded, size: 14, color: Colors.white70),
                              const SizedBox(width: 4),
                              Text(
                                currentServer.shortName,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                              ),
                              const Icon(Icons.arrow_drop_down_rounded, size: 16, color: Colors.white70),
                            ],
                          ),
                        ),
                        itemBuilder: (context) => _servers.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final srv = entry.value;
                          final isSelected = idx == _currentServerIndex;
                          return PopupMenuItem<int>(
                            value: idx,
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                  size: 14,
                                  color: isSelected ? AppTheme.primary : Colors.white38,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  srv.name,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                    color: isSelected ? Colors.white : Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(width: 6),

                      // Open directly on website in Chrome
                      IconButton(
                        tooltip: 'Open Website in Browser',
                        icon: const Icon(Icons.open_in_browser_rounded, color: Colors.white, size: 20),
                        onPressed: _openInExternalBrowser,
                      ),

                      // Reload
                      IconButton(
                        tooltip: 'Reload Stream',
                        icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
                        onPressed: () {
                          setState(() {
                            _isLoading = true;
                            _hasError = false;
                          });
                          _controller.reload();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
