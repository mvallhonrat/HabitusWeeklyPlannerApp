/**
 * Translations Module
 * Handles all translation functionality for the application
 */
const Translations = (() => {
    // Private state
    let translations = {};
    let currentLanguage = 'es';
    let isInitialized = false;

    // DOM Elements
    const elements = {
        langSelector: null,
        translationsData: null,
        langSwitch: null
    };

    // Initialize translations module
    async function init() {
        try {
            console.log('Initializing Translations module...');
            
            // Cache DOM elements
            elements.langSelector = document.getElementById('langSelector');
            elements.translationsData = document.getElementById('translations-data');
            elements.langSwitch = document.getElementById('langSwitch');

            if (!elements.translationsData) {
                throw new Error('Translations data element not found');
            }

            if (!elements.langSwitch) {
                console.warn('Language switch element not found');
            }

            // Load saved language preference
            const savedLang = localStorage.getItem('habitus_lang') || 'es';
            
            // Load translations
            await loadTranslations();
            
            // Set initial language
            await setLanguage(savedLang);
            
            isInitialized = true;
            console.log('Translations module initialized successfully');
        } catch (error) {
            console.error('Error initializing Translations module:', error);
            throw error;
        }
    }

    // Load translations from JSON
    async function loadTranslations() {
        try {
            console.log('Loading translations...');
            const translationsText = elements.translationsData.textContent;
            if (!translationsText) {
                throw new Error('Translations data is empty');
            }
            translations = JSON.parse(translationsText);
            console.log('Translations loaded successfully:', Object.keys(translations));
        } catch (error) {
            console.error('Error loading translations:', error);
            throw error;
        }
    }

    // Set the current language
    async function setLanguage(lang) {
        try {
            console.log(`Setting language to: ${lang}`);
            
            // Validate language
            if (!translations[lang]) {
                console.warn(`Language ${lang} not found, falling back to Spanish`);
                lang = 'es';
            }
            
            currentLanguage = lang;
            localStorage.setItem('habitus_lang', lang);
            
            // Update switch state
            if (elements.langSwitch) {
                elements.langSwitch.classList.toggle('active', lang === 'en');
            }
            
            // Apply translations
            await applyTranslations(lang);
            
            // Update inspirational quote
            await updateInspirationalQuote();
            
            // Update document language
            document.documentElement.lang = lang;
            
            console.log(`Language set to: ${lang}`);
        } catch (error) {
            console.error('Error setting language:', error);
            throw error;
        }
    }

    // Apply translations to the UI
    async function applyTranslations(lang) {
        try {
            const t = translations[lang] || translations['es']; // Fallback to Spanish

            // Update text content for elements with data-i18n attribute
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.value = t[key];
                    } else {
                        // For instruction items, preserve the HTML structure
                        if (key.startsWith('inst_')) {
                            el.innerHTML = t[key];
                        } else {
                            el.textContent = t[key];
                        }
                    }
                }
            });

            // Update placeholders
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });

            // Update chart titles and labels if charts exist
            updateChartTranslations(t);

            // Update document language
            document.documentElement.lang = lang;
        } catch (error) {
            console.error('Error applying translations:', error);
            throw error;
        }
    }

    // Update chart translations
    function updateChartTranslations(t) {
        if (window.chartQuadrants) {
            chartQuadrants.options.plugins.title = {
                display: true,
                text: t.chart_title_quadrants
            };
            chartQuadrants.update();
        }

        if (window.chartCompletion) {
            chartCompletion.data.labels = [t.metric_completed, t.metric_pending];
            chartCompletion.update();
        }

        if (window.chartHistoricalCompletion) {
            chartHistoricalCompletion.options.plugins.title = {
                display: true,
                text: t.chart_completion_title
            };
            chartHistoricalCompletion.update();
        }

        if (window.chartHistoricalQuadrants) {
            chartHistoricalQuadrants.options.plugins.title = {
                display: true,
                text: t.chart_quadrants_title
            };
            chartHistoricalQuadrants.update();
        }

        if (window.chartHistoricalRoles) {
            chartHistoricalRoles.options.plugins.title = {
                display: true,
                text: t.chart_roles_title
            };
            chartHistoricalRoles.update();
        }
    }

    // Update inspirational quote
    async function updateInspirationalQuote() {
        try {
            console.log('Updating inspirational quote...');
            const passagesData = document.getElementById('passages-data');
            if (!passagesData) {
                throw new Error('Passages data element not found');
            }

            const passages = JSON.parse(passagesData.textContent);
            const passage = passages[currentLanguage][Math.floor(Math.random() * passages[currentLanguage].length)];
            
            const quoteContainer = document.getElementById('verso-contenedor');
            if (quoteContainer) {
                quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">${passage.contenido}</p>
                        <p class="text-sm text-gray-600 mt-2 italic">${passage.pasaje}</p>
                    </div>
                `;
                console.log('Inspirational quote updated successfully');
            } else {
                console.warn('Quote container element not found');
            }
        } catch (error) {
            console.error('Error updating inspirational quote:', error);
            throw error;
        }
    }

    // Get a translation string
    function getTranslation(key) {
        if (!isInitialized) {
            console.warn('Translations module not initialized');
            return key;
        }
        return translations[currentLanguage]?.[key] || translations['es']?.[key] || key;
    }

    // Get current language
    function getCurrentLanguage() {
        return currentLanguage;
    }

    // Public API
    return {
        init,
        setLanguage,
        getTranslation,
        getCurrentLanguage
    };
})();

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Translations.init().catch(error => {
        console.error('Failed to initialize translations:', error);
    });
});
