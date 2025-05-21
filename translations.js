/**
 * Translations Module
 * Handles all translation functionality for the application
 */
const Translations = (() => {
    // Private state
    let translations = {};
    let currentLanguage = 'es';
    let isInitialized = false;
    const BASE_PATH = '/HabitusWeeklyPlannerApp/';

    // DOM Elements
    const elements = {
        langSelector: null,
        translationsData: null,
        langSwitch: null
    };

    // Load translations from JSON
    async function loadTranslations() {
        try {
            console.log('Loading translations...');
            
            // Try to fetch translations directly first
            try {
                const response = await fetch(`${BASE_PATH}translations.json`);
                if (!response.ok) {
                    // Try without base path as fallback
                    const fallbackResponse = await fetch('translations.json');
                    if (!fallbackResponse.ok) throw new Error('Failed to fetch translations');
                    translations = await fallbackResponse.json();
                } else {
                    translations = await response.json();
                }
                console.log('Translations loaded from fetch');
            } catch (fetchError) {
                console.warn('Error fetching translations:', fetchError);
                
                // Fallback to data element
                if (elements.translationsData && elements.translationsData.textContent) {
                    try {
                        translations = JSON.parse(elements.translationsData.textContent);
                        console.log('Translations loaded from data element');
                    } catch (parseError) {
                        console.error('Error parsing translations from data element:', parseError);
                        throw new Error('Invalid translations data format');
                    }
                } else {
                    // Last resort: try to load from script tag
                    const scriptElement = document.querySelector('script[src*="translations.json"]');
                    if (scriptElement) {
                        try {
                            const response = await fetch(scriptElement.src);
                            if (!response.ok) throw new Error('Failed to fetch translations from script tag');
                            translations = await response.json();
                            console.log('Translations loaded from script tag');
                        } catch (scriptError) {
                            console.error('Error loading translations from script tag:', scriptError);
                            throw new Error('No translations data available');
                        }
                    } else {
                        throw new Error('No translations data available');
                    }
                }
            }
            
            if (!translations || !translations.es || !translations.en) {
                throw new Error('Invalid translations format');
            }
            
            console.log('Translations loaded successfully:', Object.keys(translations));
            return translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            throw error;
        }
    }

    // Initialize translations module
    async function init() {
        try {
            console.log('Initializing Translations module...');
            
            // Cache DOM elements
            elements.langSelector = document.getElementById('langSelector');
            elements.translationsData = document.getElementById('translations-data');
            elements.langSwitch = document.getElementById('langSwitch');

            // Load translations first
            await loadTranslations();
            
            // Load saved language preference
            const savedLang = localStorage.getItem('habitus_lang') || 'es';
            
            // Set initial language
            await setLanguage(savedLang);
            
            // Set initial switch state
            if (elements.langSwitch) {
                elements.langSwitch.classList.toggle('active', savedLang === 'en');
            }
            
            isInitialized = true;
            console.log('Translations module initialized successfully');
        } catch (error) {
            console.error('Error initializing Translations module:', error);
            throw error;
        }
    }

    // Set the current language
    async function setLanguage(lang) {
        try {
            if (!isInitialized) {
                await init();
            }
            
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
            if (!isInitialized) {
                await init();
            }

            console.log('Updating inspirational quote...');
            let passages;
            
            // Try to fetch passages directly first
            try {
                const response = await fetch(`${BASE_PATH}passages.json`);
                if (!response.ok) {
                    // Try without base path as fallback
                    const fallbackResponse = await fetch('passages.json');
                    if (!fallbackResponse.ok) throw new Error('Failed to fetch passages');
                    passages = await fallbackResponse.json();
                } else {
                    passages = await response.json();
                }
                console.log('Passages loaded from fetch');
            } catch (fetchError) {
                console.warn('Error fetching passages:', fetchError);
                
                // Fallback to data element
                const passagesData = document.getElementById('passages-data');
                if (passagesData && passagesData.textContent) {
                    try {
                        passages = JSON.parse(passagesData.textContent);
                        console.log('Passages loaded from data element');
                    } catch (parseError) {
                        console.error('Error parsing passages from data element:', parseError);
                        // Last resort: try to load from script tag
                        const scriptElement = document.querySelector('script[src*="passages.json"]');
                        if (scriptElement) {
                            try {
                                const response = await fetch(scriptElement.src);
                                if (!response.ok) throw new Error('Failed to fetch passages from script tag');
                                passages = await response.json();
                                console.log('Passages loaded from script tag');
                            } catch (scriptError) {
                                console.error('Error loading passages from script tag:', scriptError);
                                throw new Error('No passages data available');
                            }
                        } else {
                            throw new Error('No passages data available');
                        }
                    }
                } else {
                    throw new Error('No passages data available');
                }
            }
            
            if (!passages || !passages[currentLanguage] || !Array.isArray(passages[currentLanguage])) {
                throw new Error('Invalid passages format');
            }

            const languagePassages = passages[currentLanguage];
            const randomIndex = Math.floor(Math.random() * languagePassages.length);
            const passage = languagePassages[randomIndex];
            
            if (!passage || !passage.contenido || !passage.pasaje) {
                throw new Error('Invalid passage format');
            }

            const quoteContainer = document.getElementById('verso-contenedor');
            if (quoteContainer) {
                quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">${passage.contenido}</p>
                        <p class="text-sm text-gray-600 mt-2 italic">${passage.pasaje}</p>
                    </div>
                `;
                console.log('Inspirational quote updated successfully');
            }
        } catch (error) {
            console.error('Error updating inspirational quote:', error);
            const quoteContainer = document.getElementById('verso-contenedor');
            if (quoteContainer) {
                const errorMessage = currentLanguage === 'es' 
                    ? 'Error al cargar el versículo'
                    : 'Error loading verse';
                quoteContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow-sm p-4">
                        <p class="text-lg font-medium text-gray-800">${errorMessage}</p>
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

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Translations.init().catch(error => {
        console.error('Failed to initialize translations:', error);
    });
});
