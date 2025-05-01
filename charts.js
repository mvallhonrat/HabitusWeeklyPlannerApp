
// charts.js - Gráficos históricos para Habitus

import { getMetrics } from './storage.js';

export function renderCharts(lang = "es") {
  const metrics = getMetrics();

  const formatDate = (entry, lang) => {
    try {
      const date = new Date(entry.fecha || entry);
      return date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const labels = metrics.map(entry => formatDate(entry, lang));

  const dataCompletion = {
    labels,
    datasets: [{
      label: lang === "en" ? "Completion %" : "Porcentaje Completado",
      data: metrics.map(m => parseFloat(m.porcentaje.replace('%','')) || 0),
      backgroundColor: "#4ade80"
    }]
  };

  const dataQuadrants = {
    labels,
    datasets: [
      { label: "Q1", data: metrics.map(m => m.q1), backgroundColor: "#ef4444" },
      { label: "Q2", data: metrics.map(m => m.q2), backgroundColor: "#22c55e" },
      { label: "Q3", data: metrics.map(m => m.q3), backgroundColor: "#eab308" },
      { label: "Q4", data: metrics.map(m => m.q4), backgroundColor: "#9ca3af" }
    ]
  };

  const dataRoles = {
    labels,
    datasets: [{
      label: lang === "en" ? "Active Roles" : "Roles Activos",
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
    options: {
      ...options,
      plugins: {
        title: {
          display: true,
          text: lang === "en" ? "Weekly Completion Percentage" : "Porcentaje de Completado por Semana"
        }
      }
    }
  });

  new Chart(document.getElementById("chartHistoric2"), {
    type: "bar",
    data: dataQuadrants,
    options: {
      ...options,
      plugins: {
        title: {
          display: true,
          text: lang === "en" ? "Tasks per Quadrant per Week" : "Tareas por Cuadrante por Semana"
        }
      }
    }
  });

  new Chart(document.getElementById("chartHistoric3"), {
    type: "bar",
    data: dataRoles,
    options: {
      ...options,
      plugins: {
        title: {
          display: true,
          text: lang === "en" ? "Active Roles per Week" : "Roles Activos por Semana"
        }
      }
    }
  });
}
