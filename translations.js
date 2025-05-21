/**
 * Translations Module
 * Handles all translation functionality for the application
 */
const Translations = (() => {
    // Private state
    let translations = {};
    let currentLanguage = 'es';

    // DOM Elements
    const elements = {
        langSelector: null,
        translationsData: null
    };

    // Initialize translations module
    function init() {
        // Cache DOM elements
        elements.langSelector = document.getElementById('langSelector');
        elements.translationsData = document.getElementById('translations-data');

        // Load saved language preference
        const savedLang = localStorage.getItem('habitus_lang') || 'es';
        setLanguage(savedLang);

        // Set up event listeners
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Language selector buttons
        const esButton = elements.langSelector?.querySelector('button[onclick="setLanguage(\'es\')"]');
        const enButton = elements.langSelector?.querySelector('button[onclick="setLanguage(\'en\')"]');

        if (esButton) esButton.addEventListener('click', () => setLanguage('es'));
        if (enButton) enButton.addEventListener('click', () => setLanguage('en'));
    }

    // Load translations from JSON
    async function loadTranslations() {
        try {
            const response = await fetch('translations.json');
            translations = await response.json();
            applyTranslations(currentLanguage);
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    // Set the current language
    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('habitus_lang', lang);
        applyTranslations(lang);
        updateInspirationalQuote();
    }

    // Apply translations to the UI
    function applyTranslations(lang) {
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
            const response = await fetch('passages.json');
            const passages = await response.json();
            const passage = passages[currentLanguage][Math.floor(Math.random() * passages[currentLanguage].length)];
            
            const quoteContainer = document.getElementById('verso-contenedor');
            if (quoteContainer) {
                quoteContainer.innerHTML = `
                    <p class="text-lg font-medium">${passage.contenido}</p>
                    <p class="text-sm text-gray-600 mt-1">${passage.pasaje}</p>
                `;
            }
        } catch (error) {
            console.error('Error loading inspirational quote:', error);
        }
    }

    // Get a translation string
    function getTranslation(key) {
        return translations[currentLanguage]?.[key] || translations['es']?.[key] || key;
    }

    // Public API
    return {
        init,
        setLanguage,
        getTranslation,
        loadTranslations
    };
})();

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Translations.init();
    Translations.loadTranslations();
});
