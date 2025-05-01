
function migrateExistingData() {
  try {
    const currentLanguage = localStorage.getItem("habitus_lang") || "es";
    const storedMetrics = localStorage.getItem('habitus_metrics');
    const storedTasks = localStorage.getItem('habitus_tasks');
    const storedTasksLog = localStorage.getItem('habitus_tasksLog');

    let hasChanges = false;

    // Helper para validar y convertir fechas
    function parseToISO(dateStr) {
      if (!dateStr || dateStr.includes('T')) return null;
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        // Detectar orden de fechas europeo DD/MM/YYYY
        const [d, m, y] = parts.map(p => parseInt(p, 10));
        const iso = new Date(y, m - 1, d);
        return !isNaN(iso.getTime()) ? iso.toISOString() : null;
      }
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toISOString() : null;
    }

    // Métricas
    if (storedMetrics) {
      const metrics = JSON.parse(storedMetrics);
      const updatedMetrics = metrics.map(metric => {
        const iso = parseToISO(metric.fecha);
        if (iso) {
          metric.fecha = iso;
          hasChanges = true;
        }
        return metric;
      });
      localStorage.setItem('habitus_metrics', JSON.stringify(updatedMetrics));
    }

    // Tareas
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);
      const updatedTasks = tasks.map(task => {
        let changed = false;
        if (task.createdDate) {
          const iso = parseToISO(task.createdDate);
          if (iso) {
            task.createdDate = iso;
            changed = true;
          }
        }
        if (task.completedDate) {
          const iso = parseToISO(task.completedDate);
          if (iso) {
            task.completedDate = iso;
            changed = true;
          }
        }
        if (changed) hasChanges = true;
        return task;
      });
      localStorage.setItem('habitus_tasks', JSON.stringify(updatedTasks));
    }

    // Historial
    if (storedTasksLog) {
      const logs = JSON.parse(storedTasksLog);
      const updatedLogs = logs.map(log => {
        let changed = false;
        const iso1 = parseToISO(log.fechaCreacion);
        const iso2 = parseToISO(log.fechaFin);
        if (iso1) {
          log.fechaCreacion = iso1;
          changed = true;
        }
        if (iso2) {
          log.fechaFin = iso2;
          changed = true;
        }
        if (changed) hasChanges = true;
        return log;
      });
      localStorage.setItem('habitus_tasksLog', JSON.stringify(updatedLogs));
    }

    if (hasChanges) {
      alert(currentLanguage === "es" ? "✅ Migración completada correctamente." : "✅ Migration completed successfully.");
      location.reload(); // recargar para reflejar cambios
    } else {
      alert(currentLanguage === "es" ? "ℹ️ No se detectaron datos que migrar." : "ℹ️ No data needed migration.");
    }
  } catch (e) {
    console.error("Migration error:", e);
    alert(currentLanguage === "es" ? "❌ Error al migrar los datos." : "❌ Error during data migration.");
  }
}
