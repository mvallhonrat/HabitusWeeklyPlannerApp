
// charts.js - Gráficos históricos de métricas

import { getMetrics } from './storage.js';

export function renderCharts(lang = "es") {
  const metrics = getMetrics();

  // Función robusta para formatear fechas
  const formatDate = (d, lang) => {
    try {
      const dt = new Date(d.fecha || d);
      return dt.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return "???";
    }
  };

  const labels = metrics.map(m => formatDate(m, lang));

  // Datos para los gráficos
  const dataCompletion = {
    labels,
    datasets: [{
      label: lang === "es" ? "Porcentaje Completado" : "Completion Percentage",
      data: metrics.map(m => parseFloat(m.porcentaje.replace('%','')) || 0),
      backgroundColor: "#4ade80"
    }]
  };

  const dataQuadrants = {
    labels,
    datasets: [
      {
        label: "Q1",
        data: metrics.map(m => m.q1),
        backgroundColor: "#ef4444"
      },
      {
        label: "Q2",
        data: metrics.map(m => m.q2),
        backgroundColor: "#22c55e"
      },
      {
        label: "Q3",
        data: metrics.map(m => m.q3),
        backgroundColor: "#eab308"
      },
      {
        label: "Q4",
        data: metrics.map(m => m.q4),
        backgroundColor: "#9ca3af"
      }
    ]
  };

  const dataRoles = {
    labels,
    datasets: [{
      label: lang === "es" ? "Roles Activos" : "Active Roles",
      data: metrics.map(m => m.roles || 0),
      backgroundColor: "#60a5fa"
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  new Chart(document.getElementById("chartHistoric1"), {
    type: "bar",
    data: dataCompletion,
    options: { ...options, plugins: { title: { display: true, text: lang === "es" ? "Porcentaje de Completado por Semana" : "Weekly Completion Percentage" } } }
  });

  new Chart(document.getElementById("chartHistoric2"), {
    type: "bar",
    data: dataQuadrants,
    options: { ...options, plugins: { title: { display: true, text: lang === "es" ? "Tareas por Cuadrante por Semana" : "Tasks per Quadrant per Week" } } }
  });

  new Chart(document.getElementById("chartHistoric3"), {
    type: "bar",
    data: dataRoles,
    options: { ...options, plugins: { title: { display: true, text: lang === "es" ? "Roles Activos por Semana" : "Active Roles per Week" } } }
  });
}
