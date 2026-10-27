import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

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

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
      DeviceOrientation.portraitUp,
    ]);
    _initWebView();
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  String get _streamUrl {
    final id = widget.item.id;
    final type = widget.item.mediaType;
    if (type == 'tv') {
      final s = widget.season ?? 1;
      final e = widget.episode ?? 1;
      return 'https://vidsrc.cc/v2/embed/tv/$id/$s/$e';
    }
    return 'https://vidsrc.cc/v2/embed/movie/$id';
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _loadProgress = progress);
          },
          onPageStarted: (_) {
            if (mounted) setState(() { _isLoading = true; _hasError = false; });
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            if (mounted) setState(() { _hasError = true; _isLoading = false; });
          },
          onNavigationRequest: (request) {
            final url = request.url;
            if (url.contains('vidsrc') ||
                url.contains('youtube') ||
                url.contains('googlevideo') ||
                url.contains('cloudfront') ||
                url.contains('jwplatform') ||
                url.contains('fastly') ||
                url.startsWith('about:') ||
                url.startsWith('blob:')) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(_streamUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.item.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            if (widget.item.mediaType == 'tv' && widget.season != null)
              Text(
                'S${widget.season} E${widget.episode ?? 1}',
                style: const TextStyle(fontSize: 12, color: Colors.white60),
              ),
          ],
        ),
        actions: [
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    value: _loadProgress > 0 ? _loadProgress / 100 : null,
                    strokeWidth: 2,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() { _isLoading = true; _hasError = false; });
              _controller.reload();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Container(
              color: Colors.black87,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset('assets/images/logo.png', width: 100, height: 100),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: 200,
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
                    const SizedBox(height: 12),
                    Text(
                      _loadProgress > 0
                          ? 'Loading... $_loadProgress%'
                          : 'Connecting to stream...',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          if (_hasError && !_isLoading)
            Container(
              color: Colors.black,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        color: Colors.redAccent, size: 64),
                    const SizedBox(height: 16),
                    const Text(
                      'Stream unavailable',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 40),
                      child: Text(
                        'This content may not be available in your region.',
                        style: TextStyle(color: Colors.white60, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        setState(() { _hasError = false; _isLoading = true; });
                        _controller.reload();
                      },
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Try Again'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Go Back',
                          style: TextStyle(color: Colors.white60)),
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
