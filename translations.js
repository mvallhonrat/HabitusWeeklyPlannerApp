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
        langSwitch: null,
        quoteContainer: null
    };

    // Initialize translations module
    async function init() {
        try {
            console.log('Initializing Translations module...');
            
            // Cache DOM elements
            elements.langSelector = document.getElementById('langSelector');
            elements.translationsData = document.getElementById('translations-data');
            elements.langSwitch = document.getElementById('langSwitch');
            elements.quoteContainer = document.getElementById('verso-contenedor');

            // Load saved language preference
            const savedLang = localStorage.getItem('habitus_lang') || 'es';
            
            // Load translations
            await loadTranslations();
            
            // Set initial language
            await setLanguage(savedLang);
            
            // Set up language switch event listener
            if (elements.langSwitch) {
                elements.langSwitch.addEventListener('click', async () => {
                    try {
                        const currentLang = getCurrentLanguage();
                        const newLang = currentLang === 'es' ? 'en' : 'es';
                        await setLanguage(newLang);
                    } catch (error) {
                        console.error('Error switching language:', error);
                    }
                });
            }
            
            isInitialized = true;
            console.log('Translations module initialized successfully');
        } catch (error) {
            console.error('Error initializing Translations module:', error);
            throw error; // Re-throw to prevent app initialization
        }
    }

    // Load translations from JSON
    async function loadTranslations() {
        try {
            console.log('Loading translations...');
            
            // Try to load from data element first
            if (elements.translationsData && elements.translationsData.textContent) {
                try {
                    const data = JSON.parse(elements.translationsData.textContent);
                    if (data && data.es && data.en) {
                        translations = data;
                        console.log('Translations loaded from data element');
                        return;
                    }
                } catch (error) {
                    console.warn('Error loading translations from data element:', error);
                }
            }

            // Try to load from file
            try {
                const response = await fetch('translations.json');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.es && data.en) {
                        translations = data;
                        console.log('Translations loaded from file');
                        return;
                    }
                }
            } catch (error) {
                console.warn('Error loading translations from file:', error);
            }

            // If we get here, use default translations
            translations = {
                es: {
                    title: "Habitus - Planificador Semanal",
                    loading_quote: "Cargando versículo...",
                    loading_quote_sub: "Por favor espera...",
                    error_loading_quote: "Error al cargar el versículo"
                },
                en: {
                    title: "Habitus - Weekly Planner",
                    loading_quote: "Loading verse...",
                    loading_quote_sub: "Please wait...",
                    error_loading_quote: "Error loading verse"
                }
            };
            console.log('Using default translations');
        } catch (error) {
            console.error('Error in loadTranslations:', error);
            throw error; // Re-throw to ensure proper error handling
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
            if (!elements.quoteContainer) {
                console.warn('Quote container element not found');
                return;
            }

            // Get passages from the global variable
            const passages = window.PASAJES_BILINGUES;
            if (!passages || !passages[currentLanguage] || !passages[currentLanguage].length) {
                throw new Error('No passages available for current language');
            }

            // Get random passage
            const languagePassages = passages[currentLanguage];
            const randomIndex = Math.floor(Math.random() * languagePassages.length);
            const passage = languagePassages[randomIndex];

            // Update the UI
            elements.quoteContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow-sm p-4">
                    <p class="text-lg font-medium text-gray-800">${passage.contenido}</p>
                    <p class="text-sm text-gray-600 mt-2 italic">${passage.pasaje}</p>
                </div>
            `;
            console.log('Inspirational quote updated successfully');
        } catch (error) {
            console.error('Error updating inspirational quote:', error);
            if (elements.quoteContainer) {
                elements.quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">${getTranslation('error_loading_quote')}</p>
                        <p class="text-sm text-gray-600 mt-2 italic">${error.message}</p>
                    </div>
                `;
            }
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
        getCurrentLanguage,
        updateInspirationalQuote
    };
})();

// Remove the automatic initialization on DOMContentLoaded
// We'll let App.init() handle this
