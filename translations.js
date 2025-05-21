// === translations.js ===
// Diccionario de traducciones
const translations = {
  es: {
    title: "Planificador Semanal",
    subtitle: "Organiza tu semana con claridad y propósito",
    new_task: "Nueva tarea",
    add_task_button: "✔️ Añadir Tarea",
    add_role: "➕ Añadir Rol",
    new_week: "🌅 Nueva Semana",
    export_metrics: "📥 Exportar Métricas",
    export_tasks: "📥 Exportar Tareas",
    review: "📝 Revisión semanal:",
    instructions_title: "📖 Instrucciones de uso",
    instructions_label: "Instrucciones",
    no_tasks: "- No hay tareas asignadas -",
    no_tasks_quadrant: "- No hay tareas en este cuadrante -",
    placeholder_role: "Nuevo rol...",
    placeholder_task: "Descripción de la tarea",
    placeholder_review: "Escribe aquí una reflexión sobre tu semana...",
    chart_percent_title: "Porcentaje de Completado por Semana",
    chart_quadrants_title: "Tareas por Cuadrante por Semana",
    chart_roles_title: "Roles Activos por Semana",
    quadrant1: "Q1",
    quadrant2: "Q2",
    quadrant3: "Q3",
    quadrant4: "Q4",
    chart_completion_label: "Porcentaje Completado",
    chart_roles_label: "Roles Activos"
  },
  en: {
    title: "Weekly Planner",
    subtitle: "Plan your week with clarity and purpose",
    new_task: "New task",
    add_task_button: "✔️ Add Task",
    add_role: "➕ Add Role",
    new_week: "🌅 New Week",
    export_metrics: "📥 Export Metrics",
    export_tasks: "📥 Export Tasks",
    review: "📝 Weekly Review:",
    instructions_title: "📖 Instructions",
    instructions_label: "Instructions",
    no_tasks: "- No tasks assigned -",
    no_tasks_quadrant: "- No tasks in this quadrant -",
    placeholder_role: "New role...",
    placeholder_task: "Task description",
    placeholder_review: "Write your weekly reflection...",
    chart_percent_title: "Weekly Completion Percentage",
    chart_quadrants_title: "Tasks per Quadrant per Week",
    chart_roles_title: "Active Roles per Week",
    quadrant1: "Q1",
    quadrant2: "Q2",
    quadrant3: "Q3",
    quadrant4: "Q4",
    chart_completion_label: "Completion Percentage",
    chart_roles_label: "Active Roles"
  }
};

// === app-translate.js ===
// Establece el idioma desde localStorage
function getLanguage() {
  return localStorage.getItem("habitus_lang") || "es";
}
function translate(key) {
  const lang = getLanguage();
  return translations[lang][key] || translations["es"][key] || key;
}

// Aplica las traducciones a elementos del DOM
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = translate(key);
    } else {
      el.innerHTML = translate(key);
    }
  });
}

/**
 * Translations Module
 * Handles multilingual support for the application
 */
const Translations = (() => {
    // Translation data
    const translations = {
        es: {
            // App
            app_name: 'Habitus - Planificador Semanal',
            
            // Instructions
            instructions_title: '📖 Instrucciones de uso',
            instructions: {
                inst_1: 'Define tus roles (por ejemplo, "Padre", "Profesional", "Estudiante")',
                inst_2: 'Añade tareas asignándoles un rol y un cuadrante',
                inst_3: 'Prioriza tareas según su urgencia e importancia',
                inst_4: 'Marca las tareas completadas',
                inst_5: 'Revisa tu progreso en los gráficos',
                inst_6: 'Al final de la semana, haz una revisión',
                inst_7: 'Comienza una nueva semana con las tareas pendientes'
            },
            
            // Roles
            roles: '🎭 Definir Roles',
            role_name: 'Nombre del rol',
            add_role: '➕ Añadir Rol',
            delete_role: '🗑️',
            active_roles: 'Roles Activos',
            
            // Tasks
            task_description: 'Nueva Tarea:',
            add_task: '✔️ Añadir Tarea',
            delete_task: '🗑️',
            complete_task: '✅',
            incomplete_task: '⭕',
            total_tasks: 'Total de Tareas',
            completion_percentage: 'Porcentaje Completado',
            
            // Quadrants
            quadrants: 'Por Cuadrantes',
            quadrant_1: 'I - Urgente/Importante',
            quadrant_2: 'II - No Urgente/Importante',
            quadrant_3: 'III - Urgente/No Importante',
            quadrant_4: 'IV - No Urgente/No Importante',
            tasks_by_quadrant: 'Tareas por Cuadrante',
            
            // Review
            weekly_review: '📝 Revisión semanal:',
            review_placeholder: 'Escribe tus reflexiones sobre la semana...',
            new_week: '🌅 Nueva Semana',
            last_review: 'Recuerda esto de la semana anterior:',
            
            // Export
            export_metrics: '📊 Exportar Métricas',
            export_tasks: '📋 Exportar Tareas',
            
            // Metrics
            metrics: '📊 Métricas Históricas',
            
            // Notifications
            notifications: {
                task_added: 'Tarea añadida',
                task_completed: 'Tarea completada',
                task_deleted: 'Tarea eliminada',
                role_added: 'Rol añadido',
                role_deleted: 'Rol eliminado',
                new_week_started: 'Nueva semana iniciada',
                review_saved: 'Revisión guardada',
                export_success: 'Exportación completada',
                export_error: 'Error al exportar',
                offline: 'Estás sin conexión. Los cambios se guardarán localmente.',
                online: 'Conexión restaurada'
            },
            
            // Errors
            errors: {
                invalid_task: 'Por favor, completa todos los campos de la tarea',
                invalid_role: 'Por favor, ingresa un nombre de rol válido',
                role_exists: 'Este rol ya existe',
                storage_error: 'Error al guardar los datos',
                load_error: 'Error al cargar los datos'
            }
        },
        
        en: {
            // App
            app_name: 'Habitus - Weekly Planner',
            
            // Instructions
            instructions_title: '📖 Usage Instructions',
            instructions: {
                inst_1: 'Define your roles (e.g., "Parent", "Professional", "Student")',
                inst_2: 'Add tasks by assigning them a role and quadrant',
                inst_3: 'Prioritize tasks based on urgency and importance',
                inst_4: 'Mark tasks as completed',
                inst_5: 'Review your progress in the charts',
                inst_6: 'At the end of the week, do a review',
                inst_7: 'Start a new week with pending tasks'
            },
            
            // Roles
            roles: '🎭 Define Roles',
            role_name: 'Role name',
            add_role: '➕ Add Role',
            delete_role: '🗑️',
            active_roles: 'Active Roles',
            
            // Tasks
            task_description: 'New Task:',
            add_task: '✔️ Add Task',
            delete_task: '🗑️',
            complete_task: '✅',
            incomplete_task: '⭕',
            total_tasks: 'Total Tasks',
            completion_percentage: 'Completion Percentage',
            
            // Quadrants
            quadrants: 'By Quadrants',
            quadrant_1: 'I - Urgent/Important',
            quadrant_2: 'II - Not Urgent/Important',
            quadrant_3: 'III - Urgent/Not Important',
            quadrant_4: 'IV - Not Urgent/Not Important',
            tasks_by_quadrant: 'Tasks by Quadrant',
            
            // Review
            weekly_review: '📝 Weekly Review:',
            review_placeholder: 'Write your reflections about the week...',
            new_week: '🌅 New Week',
            last_review: 'Remember this from last week:',
            
            // Export
            export_metrics: '📊 Export Metrics',
            export_tasks: '📋 Export Tasks',
            
            // Metrics
            metrics: '📊 Historical Metrics',
            
            // Notifications
            notifications: {
                task_added: 'Task added',
                task_completed: 'Task completed',
                task_deleted: 'Task deleted',
                role_added: 'Role added',
                role_deleted: 'Role deleted',
                new_week_started: 'New week started',
                review_saved: 'Review saved',
                export_success: 'Export completed',
                export_error: 'Export error',
                offline: 'You are offline. Changes will be saved locally.',
                online: 'Connection restored'
            },
            
            // Errors
            errors: {
                invalid_task: 'Please complete all task fields',
                invalid_role: 'Please enter a valid role name',
                role_exists: 'This role already exists',
                storage_error: 'Error saving data',
                load_error: 'Error loading data'
            }
        }
    };

    // Current language
    let currentLang = 'es';

    // Initialize translations
    function init() {
        // Set initial language based on browser preference or stored preference
        const storedLang = localStorage.getItem('language');
        if (storedLang && translations[storedLang]) {
            currentLang = storedLang;
        } else {
            const browserLang = navigator.language.split('-')[0];
            currentLang = translations[browserLang] ? browserLang : 'es';
        }
        
        // Update HTML lang attribute
        document.documentElement.lang = currentLang;
        
        // Apply translations
        applyTranslations();
        
        // Set up language selector
        setupLanguageSelector();
    }

    // Apply translations to all elements with data-i18n attribute
    function applyTranslations() {
        // Translate elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    }

    // Get translation for a key
    function getTranslation(key) {
        const keys = key.split('.');
        let value = translations[currentLang];
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        return value;
    }

    // Set up language selector
    function setupLanguageSelector() {
        const selector = document.getElementById('langSelector');
        if (!selector) return;

        selector.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.getAttribute('data-lang');
                if (translations[lang]) {
                    setLanguage(lang);
                }
            });
        });
    }

    // Set language
    function setLanguage(lang) {
        if (translations[lang]) {
            currentLang = lang;
            localStorage.setItem('language', lang);
            document.documentElement.lang = lang;
            applyTranslations();
            
            // Dispatch event for other modules
            window.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: lang }
            }));
        }
    }

    // Get current language
    function getCurrentLanguage() {
        return currentLang;
    }

    // Public API
    return {
        init,
        getTranslation,
        setLanguage,
        getCurrentLanguage
    };
})();

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Translations.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Translations;
}
