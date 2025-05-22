/**
 * Main Application Module
 * Handles application initialization and core functionality
 */
const App = (() => {
    // Private state
    let isOnline = navigator.onLine;
    let isDarkMode = false;

    // DOM Elements
    const elements = {
        themeToggle: null,
        instructionsToggle: null,
        instructionsContent: null,
        quoteContainer: null
    };

    // Initialize application
    async function init() {
        try {
            console.log('Initializing App module...');
            
            // Cache DOM elements
            elements.themeToggle = document.getElementById('themeToggle');
            elements.instructionsToggle = document.getElementById('instructionsToggle');
            elements.instructionsContent = document.getElementById('instructionsContent');
            elements.quoteContainer = document.getElementById('verso-contenedor');

            // Show initial loading state
            if (elements.quoteContainer) {
                elements.quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">Cargando aplicación...</p>
                        <p class="text-sm text-gray-600 mt-2 italic">Por favor espera...</p>
                    </div>
                `;
            }

            // Load theme preference
            loadThemePreference();

            // Set up event listeners
            setupEventListeners();

            // Initialize modules in sequence
            console.log('Initializing Translations module...');
            await Translations.init();
            
            console.log('Initializing Roles module...');
            await Roles.init();
            
            console.log('Initializing Tasks module...');
            await Tasks.init();

            // Show last review if exists
            showLastReview();

            // Show offline status if needed
            if (!isOnline) {
                showOfflineStatus();
            }

            console.log('App initialization complete');
        } catch (error) {
            console.error('Error during App initialization:', error);
            if (elements.quoteContainer) {
                elements.quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">Error al inicializar la aplicación</p>
                        <p class="text-sm text-gray-600 mt-2 italic">Por favor, recarga la página</p>
                    </div>
                `;
            }
            throw error;
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle?.addEventListener('click', toggleTheme);

        // Instructions toggle
        elements.instructionsToggle?.addEventListener('click', toggleInstructions);

        // Online/offline status
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        // Notifications
        window.addEventListener('showNotification', handleNotification);

        // Service worker registration - only if running on http/https
        if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(error => {
                    console.log('ServiceWorker registration not available (running locally)');
                });
        } else {
            console.log('ServiceWorker not available (running locally)');
        }
    }

    // Load theme preference
    function loadThemePreference() {
        // Check for saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            isDarkMode = savedTheme === 'dark';
        } else {
            // Check system preference
            isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Apply theme
        applyTheme();
    }

    // Toggle theme
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        applyTheme();
    }

    // Apply theme
    function applyTheme() {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.classList.toggle('light', !isDarkMode);
    }

    // Toggle instructions
    function toggleInstructions() {
        if (!elements.instructionsContent) return;

        const isHidden = elements.instructionsContent.classList.contains('hidden');
        elements.instructionsContent.classList.toggle('hidden');
        elements.instructionsToggle.textContent = isHidden ? '▼' : '▶';
    }

    // Show last review
    function showLastReview() {
        const lastReview = localStorage.getItem('lastReview');
        if (lastReview && elements.lastReviewBox && elements.lastReviewText) {
            elements.lastReviewBox.classList.remove('hidden');
            elements.lastReviewText.textContent = lastReview;
        }
    }

    // Handle online/offline status
    function handleOnlineStatus() {
        isOnline = navigator.onLine;
        if (isOnline) {
            const message = Translations.getTranslation('notifications.online');
            showNotification(message, 'success');
        } else {
            showOfflineStatus();
        }
    }

    // Show offline status
    function showOfflineStatus() {
        const message = Translations.getTranslation('notifications.offline');
        showNotification(message, 'warning');
    }

    // Handle notification event
    function handleNotification(event) {
        const { message, type = 'info' } = event.detail;
        showNotification(message, type);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-0 ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.classList.add('translate-y-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Public API
    return {
        init,
        showNotification,
        toggleTheme,
        toggleInstructions
    };
})();

// Make App available globally
window.App = App;

// Remove automatic initialization from App module
// The initialization will be handled by the main initApp function 