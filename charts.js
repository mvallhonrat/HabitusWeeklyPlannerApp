
// === charts.js ===
// Función para inicializar todos los gráficos históricos
function initHistoricalCharts(metrics) {
  const lang = getLanguage();
  const formatDate = d => new Date(d.fecha).toLocaleDateString(lang === "es" ? "es-ES" : "en-US");

  const labels = metrics.map(m => formatDate(m));
  const percent = metrics.map(m => parseInt(m.porcentaje));
  const roles = metrics.map(m => m.roles || 0);
  const q1 = metrics.map(m => m.q1 || 0);
  const q2 = metrics.map(m => m.q2 || 0);
  const q3 = metrics.map(m => m.q3 || 0);
  const q4 = metrics.map(m => m.q4 || 0);

  const ctx1 = document.getElementById("chartPercent").getContext("2d");
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: translate("chart_completion_label"),
        data: percent,
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgb(34, 197, 94)",
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: translate("chart_percent_title") },
        legend: { display: false }
      }
    }
  });

  const ctx2 = document.getElementById("chartQuadrants").getContext("2d");
  new Chart(ctx2, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: translate("quadrant1"),
          data: q1,
          backgroundColor: "#ef4444"
        },
        {
          label: translate("quadrant2"),
          data: q2,
          backgroundColor: "#22c55e"
        },
        {
          label: translate("quadrant3"),
          data: q3,
          backgroundColor: "#eab308"
        },
        {
          label: translate("quadrant4"),
          data: q4,
          backgroundColor: "#9ca3af"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: translate("chart_quadrants_title") },
        legend: { position: "bottom" }
      }
    }
  });

  const ctx3 = document.getElementById("chartRoles").getContext("2d");
  new Chart(ctx3, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: translate("chart_roles_label"),
        data: roles,
        backgroundColor: "#6366f1"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: translate("chart_roles_title") },
        legend: { display: false }
      }
    }
  });
}
