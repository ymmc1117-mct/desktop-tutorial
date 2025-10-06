const CACHE_NAME = 'challenge-coin-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './styles/style.css',
    './js/utils.js',
    './js/main.js',
    './icon-180.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&family=Varela+Round&display=swap' // Google Fontsもキャッシュ
];

// インストールイベント: キャッシュに追加
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// フェッチイベント: キャッシュから提供
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュにあればそれを返す
                if (response) {
                    return response;
                }
                // なければネットワークから取得
                return fetch(event.request);
            })
    );
});

// アクティベートイベント: 古いキャッシュの削除
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // 不要なキャッシュを削除
                    }
                })
            );
        })
    );
});