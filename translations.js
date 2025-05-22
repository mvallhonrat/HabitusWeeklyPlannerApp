/**
 * Translations Module
 * Handles all text content for the application
 */
const Translations = (() => {
    // Private state
    const translations = {
        // General
        title: "Habitus - Planificador Semanal",
        
        // Instructions
        instructions_title: "📖 Instrucciones de uso",
        inst_1: "🎭 <strong>Define tus Roles:</strong> Identifica los roles importantes en tu vida (por ejemplo: Padre, Profesional, Amigo). Estos serán las categorías bajo las cuales organizarás tus tareas semanales.",
        inst_2: "📝 <strong>Agrega tus Tareas:</strong> Para cada rol, añade las tareas que deseas realizar esta semana. Escribe una breve descripción y asigna el cuadrante correspondiente según su urgencia e importancia.",
        inst_3: "🔢 <strong>Prioriza con los Cuadrantes:</strong> Utiliza la Matriz de Prioridades (I-IV) para clasificar cada tarea:",
        inst_3_sub: "<ul class='list-none ml-4 mt-1'><li>I – Urgente e Importante (hacer de inmediato).</li><li>II – No Urgente e Importante (planificar tiempo para hacer).</li><li>III – Urgente y No Importante (intentar delegar o minimizar).</li><li>IV – No Urgente y No Importante (evitar en lo posible).</li></ul>",
        inst_4: "I – Urgente e Importante (hacer de inmediato).",
        inst_5: "II – No Urgente e Importante (planificar tiempo para hacer).",
        inst_6: "III – Urgente y No Importante (intentar delegar o minimizar).",
        inst_7: "IV – No Urgente y No Importante (evitar en lo posible).",
        inst_8: "✅ <strong>Marca las Completadas:</strong> A medida que termines cada tarea, márcala como realizada con la casilla de verificación.",
        inst_9: "🔄 <strong>Vista de Roles/Cuadrantes:</strong> Alterna entre la vista agrupada por roles o por cuadrantes usando las pestañas para obtener diferentes perspectivas de tus tareas.",
        inst_10: "📊 <strong>Revisa tus Métricas:</strong> Al finalizar la semana, revisa el resumen de tareas completadas y pendientes, y reflexiona sobre tu semana en Revisión Semanal.",
        inst_11: "📋 <strong>Exporta y Reinicia:</strong> Guarda un registro de tu semana utilizando Exportar Métricas y Exportar Tareas. Luego comienza una nueva semana con el botón Nueva Semana: solo las tareas completadas se removerán, las pendientes permanecerán para la siguiente semana.",
        
        // Tasks
        label_task: "Nueva Tarea:",
        placeholder_task: "Descripción de la tarea",
        add_task_button: "✔️ Añadir Tarea",
        no_tasks: "No hay tareas en esta sección",
        
        // Roles
        roles: "🎭 Definir Roles",
        placeholder_role: "Nuevo rol...",
        add_role: "➕ Añadir Rol",
        
        // Tabs
        tabs_roles: "Por Roles",
        tabs_quadrants: "Por Cuadrantes",
        
        // Review
        label_review: "📝 Revisión semanal:",
        placeholder_review: "Escribe aquí una reflexión sobre tu semana...",
        new_week: "🌅 Nueva Semana",
        
        // Metrics
        metric_total: "Total de Tareas",
        metric_percent: "Porcentaje Completado",
        metric_roles: "Roles Activos",
        metric_quadrants: "Tareas por Cuadrante",
        metric_completed: "Completadas",
        metric_pending: "Pendientes",
        
        // Charts
        chart_title_completion: "Completadas vs Pendientes",
        chart_completion_title: "Porcentaje de Completado por Semana",
        chart_quadrants_title: "Tareas por Cuadrante por Semana",
        chart_roles_title: "Roles Activos por Semana",
        
        // Notifications
        notifications: {
            task_added: "Tarea añadida correctamente",
            task_completed: "Tarea marcada como completada",
            task_uncompleted: "Tarea marcada como pendiente",
            task_deleted: "Tarea eliminada",
            review_saved: "Revisión guardada",
            new_week_started: "Nueva semana iniciada"
        }
    };

    // DOM Elements
    const elements = {
        quoteContainer: null
    };

    // Initialize translations module
    async function init() {
        try {
            console.log('Initializing Translations module...');
            
            // Cache DOM elements
            elements.quoteContainer = document.getElementById('verso-contenedor');
            
            // Update all translatable elements
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const translation = getTranslation(key);
                if (translation) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translation;
                    } else {
                        // For instruction items, preserve the HTML structure
                        if (key.startsWith('inst_')) {
                            element.innerHTML = translation;
                        } else {
                            element.textContent = translation;
                        }
                    }
                } else {
                    console.warn(`Translation not found for key: ${key}`);
                }
            });
            
            // Update placeholders
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                const translation = getTranslation(key);
                if (translation) {
                    element.placeholder = translation;
                } else {
                    console.warn(`Translation not found for placeholder key: ${key}`);
                }
            });
            
            // Remove verse container if it exists
            if (elements.quoteContainer) {
                elements.quoteContainer.remove();
            }
            
            console.log('Translations module initialized successfully');
        } catch (error) {
            console.error('Error initializing Translations module:', error);
            throw error;
        }
    }

    // Get a translation string
    function getTranslation(key) {
        return translations[key] || key;
    }

    // Public API
    return {
        init,
        getTranslation
    };
})();

// Make Translations available globally
window.Translations = Translations;


