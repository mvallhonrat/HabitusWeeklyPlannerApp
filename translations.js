
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
