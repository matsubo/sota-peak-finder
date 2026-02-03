const CACHE_NAME = 'offline-qth-v1';
const urlsToCache = [
    '/offline-qth/',
    '/offline-qth/index.html',
    '/offline-qth/styles.css',
    '/offline-qth/app.js',
    '/offline-qth/manifest.json',
    '/offline-qth/data/location-data.json',
    '/offline-qth/icon-192.png',
    '/offline-qth/icon-512.png'
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// リクエストの処理（オフライン対応）
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュがあればそれを返す
                if (response) {
                    return response;
                }

                // なければネットワークから取得
                return fetch(event.request).then(response => {
                    // 有効なレスポンスかチェック
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // レスポンスをクローンしてキャッシュに保存
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // オフラインで取得できない場合
                return new Response('オフライン中です', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});
