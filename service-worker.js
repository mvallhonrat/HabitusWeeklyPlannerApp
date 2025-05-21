const CACHE_NAME = 'habitus-v1.0.3';
const BASE_PATH = '/HabitusWeeklyPlannerApp/';

// Assets to cache
const ASSETS_TO_CACHE = [
    // Base files
    BASE_PATH + 'index.html',
    BASE_PATH + 'styles.css',
    BASE_PATH + 'app.js',
    BASE_PATH + 'tasks.js',
    BASE_PATH + 'roles.js',
    BASE_PATH + 'translations.js',
    BASE_PATH + 'translations.json',
    BASE_PATH + 'passages.json',
    BASE_PATH + 'manifest.json',
    
    // Icons
    BASE_PATH + 'icons/icon-192x192.png',
    BASE_PATH + 'icons/icon-514x5154.png',
    
    // External resources
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js@3'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.startsWith('https://cdn.tailwindcss.com') &&
        !event.request.url.startsWith('https://cdn.jsdelivr.net')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache if not a success response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch((error) => {
                console.error('Fetch failed:', error);
                // Return a fallback response for critical resources
                if (event.request.url.endsWith('translations.json')) {
                    return new Response(JSON.stringify({
                        es: { error: "Error loading translations" },
                        en: { error: "Error loading translations" }
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                if (event.request.url.endsWith('passages.json')) {
                    return new Response(JSON.stringify({
                        es: [{
                            contenido: "Porque yo sé los planes que tengo para ti...",
                            pasaje: "Jeremías 29:11"
                        }],
                        en: [{
                            contenido: "For I know the plans I have for you...",
                            pasaje: "Jeremiah 29:11"
                        }]
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            })
    );
}); 