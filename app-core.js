// Variables globales
    let roles = [];
    let tasks = [];
    let metrics = [];    // histórico semanal de métricas
    let tasksLog = [];   // histórico de tareas
    let lastReviewText = "";  // última reflexión guardada
    let lastResetTime = null; // timestamp de último "Nueva Semana"
    let chartQuadrants = null;
    let chartCompletion = null;
    let chartHistoricalCompletion = null;
    let chartHistoricalQuadrants = null;
    let chartHistoricalRoles = null;

    // === Cargar datos de localStorage (si existen) al iniciar ===
    (function loadData() {
      const storedRoles = localStorage.getItem("habitus_roles");
      const storedTasks = localStorage.getItem("habitus_tasks");
      const storedMetrics = localStorage.getItem("habitus_metrics");
      const storedTasksLog = localStorage.getItem("habitus_tasksLog");// Variables globales
    let roles = [];
    let tasks = [];
    let metrics = [];    // histórico semanal de métricas
    let tasksLog = [];   // histórico de tareas
    let lastReviewText = "";  // última reflexión guardada
    let lastResetTime = null; // timestamp de último "Nueva Semana"
    let chartQuadrants = null;
    let chartCompletion = null;
    let chartHistoricalCompletion = null;
    let chartHistoricalQuadrants = null;
    let chartHistoricalRoles = null;

    // === Cargar datos de localStorage (si existen) al iniciar ===
    (function loadData() {
      const storedRoles = localStorage.getItem("habitus_roles");
      const storedTasks = localStorage.getItem("habitus_tasks");
      const storedMetrics = localStorage.getItem("habitus_metrics");
      const storedTasksLog = localStorage.getItem("habitus_tasksLog");
      const storedLastReview = localStorage.getItem("habitus_lastReview");
      const storedLastReset = localStorage.getItem("habitus_lastReset");

      if(storedRoles) roles = JSON.parse(storedRoles);
      if(storedTasks) tasks = JSON.parse(storedTasks);
      if(storedMetrics) metrics = JSON.parse(storedMetrics);
      if(storedTasksLog) tasksLog = JSON.parse(storedTasksLog);
      if(storedLastReview) lastReviewText = JSON.parse(storedLastReview);
      if(storedLastReset) lastResetTime = parseInt(storedLastReset);

      // Poblar dropdown de roles
      updateRoleOptions();
      
      // Mostrar última revisión si existe
      if(lastReviewText && lastReviewText.trim() !== "") {
        const lastReviewBox = document.getElementById("lastReviewBox");
        const lastReviewSpan = document.getElementById("lastReviewText");
        lastReviewSpan.textContent = lastReviewText;
        lastReviewBox.style.display = "block";
      }
    })();

    // === Función para actualizar las opciones del select de roles ===
    function updateRoleOptions() {
      const roleSelect = document.getElementById("roleSelect");
      // Limpiar opciones actuales (excepto placeholder)
      roleSelect.innerHTML = '<option value="" disabled selected>Rol</option>';
      roles.forEach(role => {
        const opt = document.createElement("option");
        opt.value = role;
        opt.textContent = role;
        roleSelect.appendChild(opt);
      });
      
      renderRoleList();
    }

    // === Inicializar gráficos Chart.js ===
    function initCharts() {
      const ctxQ = document.getElementById('chartQuadrants').getContext('2d');
      const ctxC = document.getElementById('chartCompletion').getContext('2d');
      const ctxHC = document.getElementById('chartHistoricalCompletion').getContext('2d');
      const ctxHQ = document.getElementById('chartHistoricalQuadrants').getContext('2d');
      const ctxHR = document.getElementById('chartHistoricalRoles').getContext('2d');

      // Datos iniciales para gráficos
      const quadCounts = countTasksByQuadrant();
      const compCounts = countCompletedPending();
      const historicalData = prepareHistoricalData();

      // Configuración del gráfico de barras (Cuadrantes)
      chartQuadrants = new Chart(ctxQ, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Tareas',
            data: quadCounts,
            backgroundColor: ['#ef4444','#22c55e','#eab308','#9ca3af'] // rojo, verde, amarillo, gris
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            x: { 
              ticks: { color: '#374151' },
              grid: { display: false }
            },
            y: { 
              beginAtZero: true, 
              ticks: { precision: 0, color: '#374151' },
              grid: { color: '#e5e7eb' }
            }
          }
        }
      });

      // Configuración del gráfico doughnut (Completadas vs Pendientes)
      chartCompletion = new Chart(ctxC, {
        type: 'doughnut',
        data: {
          labels: ['Completadas','Pendientes'],
          datasets: [{
            data: compCounts,
            backgroundColor: ['#4ade80', '#f87171'] // verde-400, rojo-400
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            title: { display: false }
          },
          cutout: '70%'
        }
      });

      // Configuración del gráfico de línea (Porcentaje de completado histórico)
      chartHistoricalCompletion = new Chart(ctxHC, {
        type: 'line',
        data: {
          labels: historicalData.labels,
          datasets: [{
            label: 'Porcentaje Completado',
            data: historicalData.completionPercentages,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => value + '%'
              }
            }
          }
        }
      });

      // Configuración del gráfico de barras (Tareas por cuadrante histórico)
      chartHistoricalQuadrants = new Chart(ctxHQ, {
        type: 'bar',
        data: {
          labels: historicalData.labels,
          datasets: [
            {
              label: 'Q1',
              data: historicalData.q1Counts,
              backgroundColor: '#ef4444'
            },
            {
              label: 'Q2',
              data: historicalData.q2Counts,
              backgroundColor: '#22c55e'
            },
            {
              label: 'Q3',
              data: historicalData.q3Counts,
              backgroundColor: '#eab308'
            },
            {
              label: 'Q4',
              data: historicalData.q4Counts,
              backgroundColor: '#9ca3af'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true }
          }
        }
      });

      // Configuración del gráfico de línea (Roles activos histórico)
      chartHistoricalRoles = new Chart(ctxHR, {
        type: 'line',
        data: {
          labels: historicalData.labels,
          datasets: [{
            label: 'Roles Activos',
            data: historicalData.activeRoles,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });

      // Actualizar métricas actuales
      updateCurrentMetrics();
    }

    // === Preparar datos históricos para gráficos ===
    function prepareHistoricalData() {
      const labels = [];
      const completionPercentages = [];
      const q1Counts = [];
      const q2Counts = [];
      const q3Counts = [];
      const q4Counts = [];
      const activeRoles = [];

      // Get current language
      const lang = localStorage.getItem("habitus_lang") || "es";
      const invalidDateMsg = lang === "en" ? "Invalid Date" : "Fecha no válida";

      // Ordenar métricas por fecha
      const sortedMetrics = [...metrics].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      );

      sortedMetrics.forEach(metric => {
        try {
          // Ensure we have a valid date string
          const dateStr = metric.fecha || '';
          const date = new Date(dateStr);
          
          // Check if date is valid before using it
          if (!isNaN(date.getTime())) {
            labels.push(date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }));
          } else {
            // Fallback to a default label if date is invalid
            labels.push(invalidDateMsg);
          }
          
          // Remove % symbol if present and parse as integer
          const porcentaje = typeof metric.porcentaje === 'string' ? 
            parseInt(metric.porcentaje.replace('%', '')) : 
            parseInt(metric.porcentaje);
            
          completionPercentages.push(porcentaje || 0);
          q1Counts.push(metric.q1 || 0);
          q2Counts.push(metric.q2 || 0);
          q3Counts.push(metric.q3 || 0);
          q4Counts.push(metric.q4 || 0);
          activeRoles.push(metric.roles || 0);
        } catch (error) {
          console.error('Error processing metric:', error);
          // Add fallback values for this entry
          labels.push(invalidDateMsg);
          completionPercentages.push(0);
          q1Counts.push(0);
          q2Counts.push(0);
          q3Counts.push(0);
          q4Counts.push(0);
          activeRoles.push(0);
        }
      });

      return {
        labels,
        completionPercentages,
        q1Counts,
        q2Counts,
        q3Counts,
        q4Counts,
        activeRoles
      };
    }

    // === Actualizar métricas actuales ===
    function updateCurrentMetrics() {
      const totalTasks = tasks.length;
      const compPend = countCompletedPending();
      const completedCount = compPend[0];
      const pendingCount = compPend[1];
      const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const quadCounts = countTasksByQuadrant();

      document.getElementById('totalTasks').textContent = totalTasks;
      document.getElementById('completionPercentage').textContent = percent + '%';
      document.getElementById('activeRoles').textContent = roles.length;
      document.getElementById('q1Count').textContent = quadCounts[0];
      document.getElementById('q2Count').textContent = quadCounts[1];
      document.getElementById('q3Count').textContent = quadCounts[2];
      document.getElementById('q4Count').textContent = quadCounts[3];
    }

    // === Funciones utilitarias para contar tareas ===
    function countTasksByQuadrant() {
      // Devuelve un array [countQ1, countQ2, countQ3, countQ4]
      const counts = [0, 0, 0, 0];
      tasks.forEach(t => {
        if(t.quadrant >= 1 && t.quadrant <= 4 && t.completado !== 'ELIMINADO') {
          counts[t.quadrant - 1]++;
        }
      });
      return counts;
    }

    function countCompletedPending() {
      let completed = 0;
      let pending = 0;
      tasks.forEach(t => {
        if(t.completado === 'ELIMINADO') return;
        if(t.completed) completed++;
        else pending++;
      });
      return [completed, pending];
    }

    // === Función para renderizar las vistas de tareas (roles y cuadrantes) ===
    function renderViews() {
      const rolesDiv = document.getElementById("rolesView");
      const quadsDiv = document.getElementById("quadrantsView");
      let rolesHTML = "";
      let quadsHTML = "";

      // Construir vista por Roles
      if(roles.length === 0) {
        rolesHTML += '<p class="text-sm text-gray-500">* Agrega un rol para comenzar *</p>';
      } else {
        roles.forEach(role => {
          let roleSection = `<h3 class="text-lg font-semibold text-gray-700 mt-4">${role}</h3><ul class="ml-5 mb-2">`;
          const tasksForRole = tasks.filter(t => t.role === role && t.completado !== 'ELIMINADO');
          tasksForRole.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
          if(tasksForRole.length === 0) {
            roleSection += '<li class="text-sm text-gray-500 italic">- No hay tareas asignadas -</li>';
          } else {
            tasksForRole.forEach((t, idx) => {
              const globalIndex = tasks.indexOf(t); // índice en array global
              const checked = t.completed ? "checked" : "";
              const textStyle = t.completed ? "line-through text-gray-500" : "";
              // Determinar color de borde según cuadrante
              let borderColor = "";
              switch(t.quadrant) {
                case 1: borderColor = "border-red-500"; break;
                case 2: borderColor = "border-green-500"; break;
                case 3: borderColor = "border-yellow-500"; break;
                case 4: borderColor = "border-gray-500"; break;
              }
              roleSection += 
                `<li class="mb-1 ${borderColor} border-l-4 pl-2 text-sm ${textStyle}">
                   <input type="checkbox" class="mr-2 align-middle" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                   <span class="align-middle">${t.name}</span>
                   <button type="button" class="ml-2 text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
                 </li>`;
            });
          }
          roleSection += "</ul>";
          rolesHTML += roleSection;
        });
      }

      // Construir vista por Cuadrantes
      const quadrantTitles = [
        "I - Urgente e Importante",
        "II - No Urgente e Importante",
        "III - Urgente y No Importante",
        "IV - No Urgente y No Importante"
      ];
      const quadrantColors = [
        "bg-red-100 border-red-500",
        "bg-green-100 border-green-500",
        "bg-yellow-100 border-yellow-500",
        "bg-gray-100 border-gray-500"
      ];

      // Crear contenedor de grid 2x2
      quadsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[0]}</h3>
            <div class="${quadrantColors[0]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant1 = tasks.filter(t => t.quadrant === 1 && t.completado !== 'ELIMINADO');
      tasksForQuadrant1.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant1.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant1.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[1]}</h3>
            <div class="${quadrantColors[1]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant2 = tasks.filter(t => t.quadrant === 2 && t.completado !== 'ELIMINADO');
      tasksForQuadrant2.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant2.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant2.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[2]}</h3>
            <div class="${quadrantColors[2]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant3 = tasks.filter(t => t.quadrant === 3 && t.completado !== 'ELIMINADO');
      tasksForQuadrant3.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant3.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant3.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[3]}</h3>
            <div class="${quadrantColors[3]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant4 = tasks.filter(t => t.quadrant === 4 && t.completado !== 'ELIMINADO');
      tasksForQuadrant4.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant4.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant4.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
        </div>`;

      rolesDiv.innerHTML = rolesHTML;
      quadsDiv.innerHTML = quadsHTML;

      // Actualizar gráficos y métricas
      updateCharts();
      updateCurrentMetrics();
    }

    // === Mostrar/Ocultar vistas al hacer click en pestañas ===
    function showRoles() {
      document.getElementById("rolesView").classList.remove("hidden");
      document.getElementById("quadrantsView").classList.add("hidden");
      // Estilos pestañas activas/inactivas
      document.getElementById("tabRoles").classList.add("text-gray-700","border-indigo-500");
      document.getElementById("tabRoles").classList.remove("text-gray-600","border-transparent");
      document.getElementById("tabQuadrants").classList.remove("text-gray-700","border-indigo-500");
      document.getElementById("tabQuadrants").classList.add("text-gray-600","border-transparent");
    }

    function showQuadrants() {
      document.getElementById("quadrantsView").classList.remove("hidden");
      document.getElementById("rolesView").classList.add("hidden");
      // Estilos pestañas activas/inactivas
      document.getElementById("tabQuadrants").classList.add("text-gray-700","border-indigo-500");
      document.getElementById("tabQuadrants").classList.remove("text-gray-600","border-transparent");
      document.getElementById("tabRoles").classList.remove("text-gray-700","border-indigo-500");
      document.getElementById("tabRoles").classList.add("text-gray-600","border-transparent");
    }

    // === Añadir un nuevo rol ===
    function addRole() {
      const roleInput = document.getElementById("roleInput");
      let newRole = roleInput.value.trim();
      
      // Solo mostrar alerta si el campo está vacío
      if(newRole === "") {
        alert(translations[lang]["add_role_error"]);
        return;
      }
      
      // Evitar duplicados (ignorando mayúsculas/minúsculas)
      const exists = roles.some(r => r.toLowerCase() === newRole.toLowerCase());
      if(exists) {
        alert(translations[lang]["duplicate_role_error"]);
        return;
      }
      
      // Agregar y guardar
      roles.push(newRole);
      localStorage.setItem("habitus_roles", JSON.stringify(roles));
      roleInput.value = "";
      updateRoleOptions();
      renderViews();  // actualizar la vista por roles
    }

    // === Añadir una nueva tarea ===
    function addTask() {
      const taskInput = document.getElementById("taskInput");
      const roleSelect = document.getElementById("roleSelect");
      const quadrantSelect = document.getElementById("quadrantSelect");
      const name = taskInput.value.trim();
      const role = roleSelect.value;
      const quadrant = parseInt(quadrantSelect.value);

      if(name === "") {
        alert(translations[lang]["missing_task_description"]);
        return;
      }
      if(!role) {
        alert(translations[lang]["missing_task_role"]);
        return;
      }
      if(isNaN(quadrant)) {
        alert(translations[lang]["missing_task_quadrant"]);
        return;
      }
      // Crear objeto tarea
      const newTask = {
        name: name,
        role: role,
        quadrant: quadrant,
        completed: false,
        createdDate: new Date().toISOString(),
        completedDate: null
      };
      tasks.push(newTask);
      // Guardar en localStorage
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // Limpiar formulario
      taskInput.value = "";
      roleSelect.value = "";
      quadrantSelect.value = "";
      // Re-renderizar vistas
      renderViews();
    }

    // === Toggle completar tarea (checkbox) ===
    function toggleTaskCompleted(index) {
      if(index < 0 || index >= tasks.length) return;
      const task = tasks[index];
      if (task.completado === 'ELIMINADO') return;
      task.completed = !task.completed;
      task.completedDate = task.completed ? new Date().toISOString() : null;
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // Refrescar vistas y gráficos
      renderViews();
    }

    // === Eliminar una tarea con registro de eliminación ===
    function deleteTask(index) {
      if(index < 0 || index >= tasks.length) return;
      const task = tasks[index];
      if(!confirm(translations[lang]["confirm_delete_task"])) return;
      task.completado = 'ELIMINADO';
      task.completedDate = new Date().toISOString();
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      renderViews();
    }

    // === Actualizar datos de gráficos (llamado tras cambios en tareas) ===
    function updateCharts() {
      if(!chartQuadrants || !chartCompletion) {
        initCharts();
        return;
      }
      const quadCounts = countTasksByQuadrant();
      const compCounts = countCompletedPending();
      const historicalData = prepareHistoricalData();

      // Actualizar gráficos actuales
      chartQuadrants.data.datasets[0].data = quadCounts;
      chartQuadrants.update();
      chartCompletion.data.datasets[0].data = compCounts;
      chartCompletion.update();

      // Actualizar gráficos históricos
      chartHistoricalCompletion.data.labels = historicalData.labels;
      chartHistoricalCompletion.data.datasets[0].data = historicalData.completionPercentages;
      chartHistoricalCompletion.update();

      chartHistoricalQuadrants.data.labels = historicalData.labels;
      chartHistoricalQuadrants.data.datasets[0].data = historicalData.q1Counts;
      chartHistoricalQuadrants.data.datasets[1].data = historicalData.q2Counts;
      chartHistoricalQuadrants.data.datasets[2].data = historicalData.q3Counts;
      chartHistoricalQuadrants.data.datasets[3].data = historicalData.q4Counts;
      chartHistoricalQuadrants.update();

      chartHistoricalRoles.data.labels = historicalData.labels;
      chartHistoricalRoles.data.datasets[0].data = historicalData.activeRoles;
      chartHistoricalRoles.update();
    }

    // === Función "Nueva Semana" ===
    function newWeek() {
      const now = new Date();
      const todayDateStr = now.toISOString().slice(0,10); // formato "YYYY-MM-DD"
      // 1. Solo una vez por día
      if(localStorage.getItem("habitus_lastResetDate") === todayDateStr) {
        alert(translations[lang]["warning_already_reset_today"]);
        // Eliminar registro anterior de métricas del mismo día
        metrics = metrics.filter(m => !m.fecha.startsWith(now.toISOString().split('T')[0]));
        // Eliminar registros anteriores del mismo día del log de tareas
        const fechaActual = now.toISOString().split('T')[0];
        tasksLog = tasksLog.filter(entry => !entry.fechaCreacion.startsWith(fechaActual));
      }
      // 2. Confirmar si no pasaron 7 días
      if(lastResetTime) {
        const diffDays = (now.getTime() - lastResetTime) / (1000*60*60*24);
        if(diffDays < 7) {
          const confirmEarly = confirm(translations[lang]["early_reset_warning"]);
          if(!confirmEarly) {
            return;
          }
        }
      }
      // 3. y 4. Registrar métricas de la semana que termina
      const totalTasks = tasks.length;
      const compPend = countCompletedPending();
      const completedCount = compPend[0];
      const pendingCount = compPend[1];
      const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const quadCounts = countTasksByQuadrant();
      // Tomar la revisión escrita
      const reviewText = document.getElementById("reviewInput").value.trim();
      // Crear registro de métricas
      const metricsEntry = {
        fecha: now.toISOString(),  // Store in ISO format
        totales: totalTasks,
        completadas: completedCount,
        pendientes: pendingCount,
        porcentaje: percent,
        q1: quadCounts[0],
        q2: quadCounts[1],
        q3: quadCounts[2],
        q4: quadCounts[3],
        roles: roles.length,
        revision: reviewText
      };
      metrics.push(metricsEntry);
      localStorage.setItem("habitus_metrics", JSON.stringify(metrics));
      // 5. Registrar detalle de tareas en log
      tasks.forEach(t => {
        // Buscar y eliminar registros anteriores de la misma tarea
        tasksLog = tasksLog.filter(logEntry => 
          !(logEntry.tarea === t.name && 
            logEntry.rol === t.role && 
            logEntry.cuadrante === t.quadrant));

        const completado = t.completado === 'ELIMINADO' ? 'ELIMINADO' : (t.completed ? 'SI' : 'NO');

        tasksLog.push({
          fechaCreacion: new Date(t.createdDate).toISOString(),
          tarea: t.name,
          rol: t.role,
          cuadrante: t.quadrant,
          completado: completado,
          fechaFin: t.completedDate ? new Date(t.completedDate).toISOString() : ""
        });
      });
      localStorage.setItem("habitus_tasksLog", JSON.stringify(tasksLog));
      // 6. Eliminar tareas completadas y conservar pendientes
      tasks = tasks.filter(t => !t.completed && t.completado !== 'ELIMINADO');
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // 7. Guardar la última revisión para mostrarla la semana siguiente
      lastReviewText = reviewText;
      localStorage.setItem("habitus_lastReview", JSON.stringify(lastReviewText));
      // 8. Limpiar el campo de revisión para la nueva semana
      document.getElementById("reviewInput").value = "";
      // Mostrar la caja de "Recuerda esto..." con el texto recién guardado
      if(lastReviewText !== "") {
        const lastReviewBox = document.getElementById("lastReviewBox");
        const lastReviewSpan = document.getElementById("lastReviewText");
        lastReviewSpan.textContent = lastReviewText;
        lastReviewBox.style.display = "block";
      } else {
        document.getElementById("lastReviewBox").style.display = "none";
      }
      // 9. Actualizar fecha de último reinicio
      lastResetTime = now.getTime();
      localStorage.setItem("habitus_lastReset", lastResetTime.toString());
      localStorage.setItem("habitus_lastResetDate", todayDateStr);
      // 10. Refrescar vistas y gráficas para la nueva semana
      renderViews();
      alert("✅ ¡Nueva semana iniciada! Se han archivado las tareas completadas y puedes continuar con las pendientes.");
    }

    // === Exportar datos a CSV ===
    function exportCSV(type) {
      let csvContent = "";
      if(type === "metrics") {
        // Encabezados
        csvContent += "Fecha,Hora,Totales,Completadas,Pendientes,Porcentaje,Q1,Q2,Q3,Q4,Roles,Revision\n";
        metrics.forEach(entry => {
          // Escapar comas en revisión envolviendo entre comillas
          let revisionText = entry.revision;
          if(revisionText && revisionText.includes(',')) {
            revisionText = '"' + revisionText.replace(/"/g,'""') + '"';
          }
          csvContent += `${entry.fecha},${entry.totales},${entry.completadas},${entry.pendientes},${entry.porcentaje},${entry.q1},${entry.q2},${entry.q3},${entry.q4},${entry.roles},${revisionText}\n`;
        });
        downloadCSV(csvContent, "DatosMetricas.csv");
      } else if(type === "tasks") {
        csvContent += "Fecha Creacion,Hora Cracion,Tarea,Rol,Cuadrante,Completado,Fecha Fin, Hora Fin\n";
        tasksLog.forEach(entry => {
          // Escapar comas en tarea o rol si existieran
          let tareaText = entry.tarea;
          if(tareaText.includes(',')) {
            tareaText = '"' + tareaText.replace(/"/g,'""') + '"';
          }
          let rolText = entry.rol;
          if(rolText.includes(',')) {
            rolText = '"' + rolText.replace(/"/g,'""') + '"';
          }
          csvContent += `${entry.fechaCreacion},${tareaText},${rolText},${entry.cuadrante},${entry.completado},${entry.fechaFin}\n`;
        });
        downloadCSV(csvContent, "DatosTareas.csv");
      }
    }

    // Helper para descargar CSV
    function downloadCSV(csvContent, filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // === Función para renderizar la lista de roles ===
    function renderRoleList() {
      const rolesList = document.getElementById("rolesList");
      rolesList.innerHTML = ""; // Limpiar lista actual
      
      if(roles.length === 0) {
        rolesList.innerHTML = '<p class="text-sm text-gray-500">* No hay roles definidos *</p>';
        return;
      }
      
      roles.forEach((role, index) => {
        const roleItem = document.createElement("div");
        roleItem.className = "flex items-center justify-between bg-white p-2 rounded shadow-sm";
        roleItem.innerHTML = `
          <span class="text-sm">${role}</span>
          <button onclick="deleteRole(${index})" class="text-red-500 hover:text-red-700">
            🗑️
          </button>
        `;
        rolesList.appendChild(roleItem);
      });
    }

    // === Función para eliminar un rol ===
    function deleteRole(index) {
      const roleToDelete = roles[index];
      // Verificar si hay tareas asociadas a este rol
      const tasksForRole = tasks.filter(t => t.role === roleToDelete && t.completado !== 'ELIMINADO');
      
      if(tasksForRole.length > 0) {
        if(!confirm(`⚠️ El rol "${roleToDelete}" tiene ${tasksForRole.length} tarea(s) pendiente(s). ¿Estás seguro que deseas eliminar este rol? Las tareas asociadas también se eliminarán.`)) {
          return;
        }
      } else {
        if(!confirm(`¿Estás seguro que deseas eliminar el rol "${roleToDelete}"?`)) {
          return;
        }
      }
      
      // Eliminar el rol
      roles.splice(index, 1);
      localStorage.setItem("habitus_roles", JSON.stringify(roles));
      
      // Eliminar tareas asociadas a este rol
      tasks = tasks.filter(t => t.role !== roleToDelete);
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      
      // Actualizar vistas
      updateRoleOptions();
      renderViews();
    }

    // === Función para migrar datos existentes ===
    function migrateExistingData() {
      try {
        // Get current language
        const currentLanguage = localStorage.getItem("habitus_lang") || "es";
        
        // Get existing data from localStorage with correct keys
        const storedMetrics = localStorage.getItem('habitus_metrics');
        const storedTasks = localStorage.getItem('habitus_tasks');
        const storedTasksLog = localStorage.getItem('habitus_tasksLog');

        let hasChanges = false;

        // Migrate metrics
        if (storedMetrics) {
          const metrics = JSON.parse(storedMetrics);
          const updatedMetrics = metrics.map(metric => {
            if (metric.fecha && !metric.fecha.includes('T')) {
              try {
                const date = new Date(metric.fecha);
                if (!isNaN(date.getTime())) {
                  metric.fecha = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating metric date:', e);
              }
            }
            return metric;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_metrics', JSON.stringify(updatedMetrics));
          }
        }

        // Migrate tasks
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          const updatedTasks = tasks.map(task => {
            if (task.createdDate && !task.createdDate.includes('T')) {
              try {
                const date = new Date(task.createdDate);
                if (!isNaN(date.getTime())) {
                  task.createdDate = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task createdDate:', e);
              }
            }
            if (task.completedDate && !task.completedDate.includes('T')) {
              try {
                const date = new Date(task.completedDate);
                if (!isNaN(date.getTime())) {
                  task.completedDate = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task completedDate:', e);
              }
            }
            return task;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_tasks', JSON.stringify(updatedTasks));
          }
        }

        // Migrate tasks log
        if (storedTasksLog) {
          const tasksLog = JSON.parse(storedTasksLog);
          const updatedTasksLog = tasksLog.map(log => {
            if (log.fechaCreacion && !log.fechaCreacion.includes('T')) {
              try {
                const date = new Date(log.fechaCreacion);
                if (!isNaN(date.getTime())) {
                  log.fechaCreacion = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task log fechaCreacion:', e);
              }
            }
            if (log.fechaFin && !log.fechaFin.includes('T')) {
              try {
                const date = new Date(log.fechaFin);
                if (!isNaN(date.getTime())) {
                  log.fechaFin = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task log fechaFin:', e);
              }
            }
            return log;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_tasksLog', JSON.stringify(updatedTasksLog));
          }
        }

        if (hasChanges) {
          // Reload data and refresh views
          loadData();
          renderViews();
          initCharts();
          alert(currentLanguage === 'es' ? 'Datos migrados exitosamente' : 'Data migrated successfully');
        } else {
          alert(currentLanguage === 'es' ? 'No se encontraron datos para migrar' : 'No data found to migrate');
        }
      } catch (error) {
        console.error('Error during migration:', error);
        const currentLanguage = localStorage.getItem("habitus_lang") || "es";
        alert(currentLanguage === 'es' ? 'Error durante la migración' : 'Error during migration');
      }
    }

    // Attach the function to the window object
    window.migrateExistingData = migrateExistingData;

    // === Inicializar la aplicación al cargar la página ===
    document.addEventListener('DOMContentLoaded', () => {
      // Registrar Service Worker con ruta relativa
      if ('serviceWorker' in navigator) {
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        navigator.serviceWorker.register(basePath + 'sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful');
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      }

      renderRoleList();
      // Asegurarse de que el botón tenga el event listener correcto
      const addRoleBtn = document.getElementById("addRoleBtn");
      addRoleBtn.onclick = addRole;  // Usar onclick en lugar de addEventListener para evitar duplicados
      
      // Iniciar gráficos con datos actuales
      initCharts();
      // Renderizar vistas iniciales
      renderViews();
    });

      const storedLastReview = localStorage.getItem("habitus_lastReview");
      const storedLastReset = localStorage.getItem("habitus_lastReset");

      if(storedRoles) roles = JSON.parse(storedRoles);
      if(storedTasks) tasks = JSON.parse(storedTasks);
      if(storedMetrics) metrics = JSON.parse(storedMetrics);
      if(storedTasksLog) tasksLog = JSON.parse(storedTasksLog);
      if(storedLastReview) lastReviewText = JSON.parse(storedLastReview);
      if(storedLastReset) lastResetTime = parseInt(storedLastReset);

      // Poblar dropdown de roles
      updateRoleOptions();
      
      // Mostrar última revisión si existe
      if(lastReviewText && lastReviewText.trim() !== "") {
        const lastReviewBox = document.getElementById("lastReviewBox");
        const lastReviewSpan = document.getElementById("lastReviewText");
        lastReviewSpan.textContent = lastReviewText;
        lastReviewBox.style.display = "block";
      }
    })();

    // === Función para actualizar las opciones del select de roles ===
    function updateRoleOptions() {
      const roleSelect = document.getElementById("roleSelect");
      // Limpiar opciones actuales (excepto placeholder)
      roleSelect.innerHTML = '<option value="" disabled selected>Rol</option>';
      roles.forEach(role => {
        const opt = document.createElement("option");
        opt.value = role;
        opt.textContent = role;
        roleSelect.appendChild(opt);
      });
      
      renderRoleList();
    }

    // === Inicializar gráficos Chart.js ===
    function initCharts() {
      const ctxQ = document.getElementById('chartQuadrants').getContext('2d');
      const ctxC = document.getElementById('chartCompletion').getContext('2d');
      const ctxHC = document.getElementById('chartHistoricalCompletion').getContext('2d');
      const ctxHQ = document.getElementById('chartHistoricalQuadrants').getContext('2d');
      const ctxHR = document.getElementById('chartHistoricalRoles').getContext('2d');

      // Datos iniciales para gráficos
      const quadCounts = countTasksByQuadrant();
      const compCounts = countCompletedPending();
      const historicalData = prepareHistoricalData();

      // Configuración del gráfico de barras (Cuadrantes)
      chartQuadrants = new Chart(ctxQ, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Tareas',
            data: quadCounts,
            backgroundColor: ['#ef4444','#22c55e','#eab308','#9ca3af'] // rojo, verde, amarillo, gris
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            x: { 
              ticks: { color: '#374151' },
              grid: { display: false }
            },
            y: { 
              beginAtZero: true, 
              ticks: { precision: 0, color: '#374151' },
              grid: { color: '#e5e7eb' }
            }
          }
        }
      });

      // Configuración del gráfico doughnut (Completadas vs Pendientes)
      chartCompletion = new Chart(ctxC, {
        type: 'doughnut',
        data: {
          labels: ['Completadas','Pendientes'],
          datasets: [{
            data: compCounts,
            backgroundColor: ['#4ade80', '#f87171'] // verde-400, rojo-400
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            },
            title: { display: false }
          },
          cutout: '70%'
        }
      });

      // Configuración del gráfico de línea (Porcentaje de completado histórico)
      chartHistoricalCompletion = new Chart(ctxHC, {
        type: 'line',
        data: {
          labels: historicalData.labels,
          datasets: [{
            label: 'Porcentaje Completado',
            data: historicalData.completionPercentages,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => value + '%'
              }
            }
          }
        }
      });

      // Configuración del gráfico de barras (Tareas por cuadrante histórico)
      chartHistoricalQuadrants = new Chart(ctxHQ, {
        type: 'bar',
        data: {
          labels: historicalData.labels,
          datasets: [
            {
              label: 'Q1',
              data: historicalData.q1Counts,
              backgroundColor: '#ef4444'
            },
            {
              label: 'Q2',
              data: historicalData.q2Counts,
              backgroundColor: '#22c55e'
            },
            {
              label: 'Q3',
              data: historicalData.q3Counts,
              backgroundColor: '#eab308'
            },
            {
              label: 'Q4',
              data: historicalData.q4Counts,
              backgroundColor: '#9ca3af'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true }
          }
        }
      });

      // Configuración del gráfico de línea (Roles activos histórico)
      chartHistoricalRoles = new Chart(ctxHR, {
        type: 'line',
        data: {
          labels: historicalData.labels,
          datasets: [{
            label: 'Roles Activos',
            data: historicalData.activeRoles,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });

      // Actualizar métricas actuales
      updateCurrentMetrics();
    }

    // === Preparar datos históricos para gráficos ===
    function prepareHistoricalData() {
      const labels = [];
      const completionPercentages = [];
      const q1Counts = [];
      const q2Counts = [];
      const q3Counts = [];
      const q4Counts = [];
      const activeRoles = [];

      // Get current language
      const lang = localStorage.getItem("habitus_lang") || "es";
      const invalidDateMsg = lang === "en" ? "Invalid Date" : "Fecha no válida";

      // Ordenar métricas por fecha
      const sortedMetrics = [...metrics].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      );

      sortedMetrics.forEach(metric => {
        try {
          // Ensure we have a valid date string
          const dateStr = metric.fecha || '';
          const date = new Date(dateStr);
          
          // Check if date is valid before using it
          if (!isNaN(date.getTime())) {
            labels.push(date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }));
          } else {
            // Fallback to a default label if date is invalid
            labels.push(invalidDateMsg);
          }
          
          // Remove % symbol if present and parse as integer
          const porcentaje = typeof metric.porcentaje === 'string' ? 
            parseInt(metric.porcentaje.replace('%', '')) : 
            parseInt(metric.porcentaje);
            
          completionPercentages.push(porcentaje || 0);
          q1Counts.push(metric.q1 || 0);
          q2Counts.push(metric.q2 || 0);
          q3Counts.push(metric.q3 || 0);
          q4Counts.push(metric.q4 || 0);
          activeRoles.push(metric.roles || 0);
        } catch (error) {
          console.error('Error processing metric:', error);
          // Add fallback values for this entry
          labels.push(invalidDateMsg);
          completionPercentages.push(0);
          q1Counts.push(0);
          q2Counts.push(0);
          q3Counts.push(0);
          q4Counts.push(0);
          activeRoles.push(0);
        }
      });

      return {
        labels,
        completionPercentages,
        q1Counts,
        q2Counts,
        q3Counts,
        q4Counts,
        activeRoles
      };
    }

    // === Actualizar métricas actuales ===
    function updateCurrentMetrics() {
      const totalTasks = tasks.length;
      const compPend = countCompletedPending();
      const completedCount = compPend[0];
      const pendingCount = compPend[1];
      const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const quadCounts = countTasksByQuadrant();

      document.getElementById('totalTasks').textContent = totalTasks;
      document.getElementById('completionPercentage').textContent = percent + '%';
      document.getElementById('activeRoles').textContent = roles.length;
      document.getElementById('q1Count').textContent = quadCounts[0];
      document.getElementById('q2Count').textContent = quadCounts[1];
      document.getElementById('q3Count').textContent = quadCounts[2];
      document.getElementById('q4Count').textContent = quadCounts[3];
    }

    // === Funciones utilitarias para contar tareas ===
    function countTasksByQuadrant() {
      // Devuelve un array [countQ1, countQ2, countQ3, countQ4]
      const counts = [0, 0, 0, 0];
      tasks.forEach(t => {
        if(t.quadrant >= 1 && t.quadrant <= 4 && t.completado !== 'ELIMINADO') {
          counts[t.quadrant - 1]++;
        }
      });
      return counts;
    }

    function countCompletedPending() {
      let completed = 0;
      let pending = 0;
      tasks.forEach(t => {
        if(t.completado === 'ELIMINADO') return;
        if(t.completed) completed++;
        else pending++;
      });
      return [completed, pending];
    }

    // === Función para renderizar las vistas de tareas (roles y cuadrantes) ===
    function renderViews() {
      const rolesDiv = document.getElementById("rolesView");
      const quadsDiv = document.getElementById("quadrantsView");
      let rolesHTML = "";
      let quadsHTML = "";

      // Construir vista por Roles
      if(roles.length === 0) {
        rolesHTML += '<p class="text-sm text-gray-500">* Agrega un rol para comenzar *</p>';
      } else {
        roles.forEach(role => {
          let roleSection = `<h3 class="text-lg font-semibold text-gray-700 mt-4">${role}</h3><ul class="ml-5 mb-2">`;
          const tasksForRole = tasks.filter(t => t.role === role && t.completado !== 'ELIMINADO');
          tasksForRole.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
          if(tasksForRole.length === 0) {
            roleSection += '<li class="text-sm text-gray-500 italic">- No hay tareas asignadas -</li>';
          } else {
            tasksForRole.forEach((t, idx) => {
              const globalIndex = tasks.indexOf(t); // índice en array global
              const checked = t.completed ? "checked" : "";
              const textStyle = t.completed ? "line-through text-gray-500" : "";
              // Determinar color de borde según cuadrante
              let borderColor = "";
              switch(t.quadrant) {
                case 1: borderColor = "border-red-500"; break;
                case 2: borderColor = "border-green-500"; break;
                case 3: borderColor = "border-yellow-500"; break;
                case 4: borderColor = "border-gray-500"; break;
              }
              roleSection += 
                `<li class="mb-1 ${borderColor} border-l-4 pl-2 text-sm ${textStyle}">
                   <input type="checkbox" class="mr-2 align-middle" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                   <span class="align-middle">${t.name}</span>
                   <button type="button" class="ml-2 text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
                 </li>`;
            });
          }
          roleSection += "</ul>";
          rolesHTML += roleSection;
        });
      }

      // Construir vista por Cuadrantes
      const quadrantTitles = [
        "I - Urgente e Importante",
        "II - No Urgente e Importante",
        "III - Urgente y No Importante",
        "IV - No Urgente y No Importante"
      ];
      const quadrantColors = [
        "bg-red-100 border-red-500",
        "bg-green-100 border-green-500",
        "bg-yellow-100 border-yellow-500",
        "bg-gray-100 border-gray-500"
      ];

      // Crear contenedor de grid 2x2
      quadsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[0]}</h3>
            <div class="${quadrantColors[0]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant1 = tasks.filter(t => t.quadrant === 1 && t.completado !== 'ELIMINADO');
      tasksForQuadrant1.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant1.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant1.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[1]}</h3>
            <div class="${quadrantColors[1]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant2 = tasks.filter(t => t.quadrant === 2 && t.completado !== 'ELIMINADO');
      tasksForQuadrant2.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant2.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant2.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[2]}</h3>
            <div class="${quadrantColors[2]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant3 = tasks.filter(t => t.quadrant === 3 && t.completado !== 'ELIMINADO');
      tasksForQuadrant3.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant3.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant3.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${quadrantTitles[3]}</h3>
            <div class="${quadrantColors[3]} border-l-4 p-3 rounded">
              <ul class="space-y-2">`;
      
      const tasksForQuadrant4 = tasks.filter(t => t.quadrant === 4 && t.completado !== 'ELIMINADO');
      tasksForQuadrant4.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      
      if (tasksForQuadrant4.length === 0) {
        quadsHTML += '<li class="text-sm text-gray-500 italic">- No hay tareas en este cuadrante -</li>';
      } else {
        tasksForQuadrant4.forEach(t => {
          const globalIndex = tasks.indexOf(t);
          const checked = t.completed ? "checked" : "";
          const textStyle = t.completed ? "line-through text-gray-500" : "";
          quadsHTML += `
            <li class="flex items-center justify-between ${textStyle}">
              <div class="flex items-center">
                <input type="checkbox" class="mr-2" onclick="toggleTaskCompleted(${globalIndex})" ${checked}>
                <span>${t.name}</span>
              </div>
              <div class="flex items-center">
                <span class="text-xs text-gray-500 mr-2">${t.role}</span>
                <button type="button" class="text-gray-500 hover:text-red-500" onclick="deleteTask(${globalIndex})">🗑️</button>
              </div>
            </li>`;
        });
      }
      
      quadsHTML += `
              </ul>
            </div>
          </div>
        </div>`;

      rolesDiv.innerHTML = rolesHTML;
      quadsDiv.innerHTML = quadsHTML;

      // Actualizar gráficos y métricas
      updateCharts();
      updateCurrentMetrics();
    }

    // === Mostrar/Ocultar vistas al hacer click en pestañas ===
    function showRoles() {
      document.getElementById("rolesView").classList.remove("hidden");
      document.getElementById("quadrantsView").classList.add("hidden");
      // Estilos pestañas activas/inactivas
      document.getElementById("tabRoles").classList.add("text-gray-700","border-indigo-500");
      document.getElementById("tabRoles").classList.remove("text-gray-600","border-transparent");
      document.getElementById("tabQuadrants").classList.remove("text-gray-700","border-indigo-500");
      document.getElementById("tabQuadrants").classList.add("text-gray-600","border-transparent");
    }

    function showQuadrants() {
      document.getElementById("quadrantsView").classList.remove("hidden");
      document.getElementById("rolesView").classList.add("hidden");
      // Estilos pestañas activas/inactivas
      document.getElementById("tabQuadrants").classList.add("text-gray-700","border-indigo-500");
      document.getElementById("tabQuadrants").classList.remove("text-gray-600","border-transparent");
      document.getElementById("tabRoles").classList.remove("text-gray-700","border-indigo-500");
      document.getElementById("tabRoles").classList.add("text-gray-600","border-transparent");
    }

    // === Añadir un nuevo rol ===
    function addRole() {
      const roleInput = document.getElementById("roleInput");
      let newRole = roleInput.value.trim();
      
      // Solo mostrar alerta si el campo está vacío
      if(newRole === "") {
        alert(translations[lang]["add_role_error"]);
        return;
      }
      
      // Evitar duplicados (ignorando mayúsculas/minúsculas)
      const exists = roles.some(r => r.toLowerCase() === newRole.toLowerCase());
      if(exists) {
        alert(translations[lang]["duplicate_role_error"]);
        return;
      }
      
      // Agregar y guardar
      roles.push(newRole);
      localStorage.setItem("habitus_roles", JSON.stringify(roles));
      roleInput.value = "";
      updateRoleOptions();
      renderViews();  // actualizar la vista por roles
    }

    // === Añadir una nueva tarea ===
    function addTask() {
      const taskInput = document.getElementById("taskInput");
      const roleSelect = document.getElementById("roleSelect");
      const quadrantSelect = document.getElementById("quadrantSelect");
      const name = taskInput.value.trim();
      const role = roleSelect.value;
      const quadrant = parseInt(quadrantSelect.value);

      if(name === "") {
        alert(translations[lang]["missing_task_description"]);
        return;
      }
      if(!role) {
        alert(translations[lang]["missing_task_role"]);
        return;
      }
      if(isNaN(quadrant)) {
        alert(translations[lang]["missing_task_quadrant"]);
        return;
      }
      // Crear objeto tarea
      const newTask = {
        name: name,
        role: role,
        quadrant: quadrant,
        completed: false,
        createdDate: new Date().toISOString(),
        completedDate: null
      };
      tasks.push(newTask);
      // Guardar en localStorage
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // Limpiar formulario
      taskInput.value = "";
      roleSelect.value = "";
      quadrantSelect.value = "";
      // Re-renderizar vistas
      renderViews();
    }

    // === Toggle completar tarea (checkbox) ===
    function toggleTaskCompleted(index) {
      if(index < 0 || index >= tasks.length) return;
      const task = tasks[index];
      if (task.completado === 'ELIMINADO') return;
      task.completed = !task.completed;
      task.completedDate = task.completed ? new Date().toISOString() : null;
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // Refrescar vistas y gráficos
      renderViews();
    }

    // === Eliminar una tarea con registro de eliminación ===
    function deleteTask(index) {
      if(index < 0 || index >= tasks.length) return;
      const task = tasks[index];
      if(!confirm(translations[lang]["confirm_delete_task"])) return;
      task.completado = 'ELIMINADO';
      task.completedDate = new Date().toISOString();
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      renderViews();
    }

    // === Actualizar datos de gráficos (llamado tras cambios en tareas) ===
    function updateCharts() {
      if(!chartQuadrants || !chartCompletion) {
        initCharts();
        return;
      }
      const quadCounts = countTasksByQuadrant();
      const compCounts = countCompletedPending();
      const historicalData = prepareHistoricalData();

      // Actualizar gráficos actuales
      chartQuadrants.data.datasets[0].data = quadCounts;
      chartQuadrants.update();
      chartCompletion.data.datasets[0].data = compCounts;
      chartCompletion.update();

      // Actualizar gráficos históricos
      chartHistoricalCompletion.data.labels = historicalData.labels;
      chartHistoricalCompletion.data.datasets[0].data = historicalData.completionPercentages;
      chartHistoricalCompletion.update();

      chartHistoricalQuadrants.data.labels = historicalData.labels;
      chartHistoricalQuadrants.data.datasets[0].data = historicalData.q1Counts;
      chartHistoricalQuadrants.data.datasets[1].data = historicalData.q2Counts;
      chartHistoricalQuadrants.data.datasets[2].data = historicalData.q3Counts;
      chartHistoricalQuadrants.data.datasets[3].data = historicalData.q4Counts;
      chartHistoricalQuadrants.update();

      chartHistoricalRoles.data.labels = historicalData.labels;
      chartHistoricalRoles.data.datasets[0].data = historicalData.activeRoles;
      chartHistoricalRoles.update();
    }

    // === Función "Nueva Semana" ===
    function newWeek() {
      const now = new Date();
      const todayDateStr = now.toISOString().slice(0,10); // formato "YYYY-MM-DD"
      // 1. Solo una vez por día
      if(localStorage.getItem("habitus_lastResetDate") === todayDateStr) {
        alert(translations[lang]["warning_already_reset_today"]);
        // Eliminar registro anterior de métricas del mismo día
        metrics = metrics.filter(m => !m.fecha.startsWith(now.toISOString().split('T')[0]));
        // Eliminar registros anteriores del mismo día del log de tareas
        const fechaActual = now.toISOString().split('T')[0];
        tasksLog = tasksLog.filter(entry => !entry.fechaCreacion.startsWith(fechaActual));
      }
      // 2. Confirmar si no pasaron 7 días
      if(lastResetTime) {
        const diffDays = (now.getTime() - lastResetTime) / (1000*60*60*24);
        if(diffDays < 7) {
          const confirmEarly = confirm(translations[lang]["early_reset_warning"]);
          if(!confirmEarly) {
            return;
          }
        }
      }
      // 3. y 4. Registrar métricas de la semana que termina
      const totalTasks = tasks.length;
      const compPend = countCompletedPending();
      const completedCount = compPend[0];
      const pendingCount = compPend[1];
      const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const quadCounts = countTasksByQuadrant();
      // Tomar la revisión escrita
      const reviewText = document.getElementById("reviewInput").value.trim();
      // Crear registro de métricas
      const metricsEntry = {
        fecha: now.toISOString(),  // Store in ISO format
        totales: totalTasks,
        completadas: completedCount,
        pendientes: pendingCount,
        porcentaje: percent,
        q1: quadCounts[0],
        q2: quadCounts[1],
        q3: quadCounts[2],
        q4: quadCounts[3],
        roles: roles.length,
        revision: reviewText
      };
      metrics.push(metricsEntry);
      localStorage.setItem("habitus_metrics", JSON.stringify(metrics));
      // 5. Registrar detalle de tareas en log
      tasks.forEach(t => {
        // Buscar y eliminar registros anteriores de la misma tarea
        tasksLog = tasksLog.filter(logEntry => 
          !(logEntry.tarea === t.name && 
            logEntry.rol === t.role && 
            logEntry.cuadrante === t.quadrant));

        const completado = t.completado === 'ELIMINADO' ? 'ELIMINADO' : (t.completed ? 'SI' : 'NO');

        tasksLog.push({
          fechaCreacion: new Date(t.createdDate).toISOString(),
          tarea: t.name,
          rol: t.role,
          cuadrante: t.quadrant,
          completado: completado,
          fechaFin: t.completedDate ? new Date(t.completedDate).toISOString() : ""
        });
      });
      localStorage.setItem("habitus_tasksLog", JSON.stringify(tasksLog));
      // 6. Eliminar tareas completadas y conservar pendientes
      tasks = tasks.filter(t => !t.completed && t.completado !== 'ELIMINADO');
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      // 7. Guardar la última revisión para mostrarla la semana siguiente
      lastReviewText = reviewText;
      localStorage.setItem("habitus_lastReview", JSON.stringify(lastReviewText));
      // 8. Limpiar el campo de revisión para la nueva semana
      document.getElementById("reviewInput").value = "";
      // Mostrar la caja de "Recuerda esto..." con el texto recién guardado
      if(lastReviewText !== "") {
        const lastReviewBox = document.getElementById("lastReviewBox");
        const lastReviewSpan = document.getElementById("lastReviewText");
        lastReviewSpan.textContent = lastReviewText;
        lastReviewBox.style.display = "block";
      } else {
        document.getElementById("lastReviewBox").style.display = "none";
      }
      // 9. Actualizar fecha de último reinicio
      lastResetTime = now.getTime();
      localStorage.setItem("habitus_lastReset", lastResetTime.toString());
      localStorage.setItem("habitus_lastResetDate", todayDateStr);
      // 10. Refrescar vistas y gráficas para la nueva semana
      renderViews();
      alert("✅ ¡Nueva semana iniciada! Se han archivado las tareas completadas y puedes continuar con las pendientes.");
    }

    // === Exportar datos a CSV ===
    function exportCSV(type) {
      let csvContent = "";
      if(type === "metrics") {
        // Encabezados
        csvContent += "Fecha,Hora,Totales,Completadas,Pendientes,Porcentaje,Q1,Q2,Q3,Q4,Roles,Revision\n";
        metrics.forEach(entry => {
          // Escapar comas en revisión envolviendo entre comillas
          let revisionText = entry.revision;
          if(revisionText && revisionText.includes(',')) {
            revisionText = '"' + revisionText.replace(/"/g,'""') + '"';
          }
          csvContent += `${entry.fecha},${entry.totales},${entry.completadas},${entry.pendientes},${entry.porcentaje},${entry.q1},${entry.q2},${entry.q3},${entry.q4},${entry.roles},${revisionText}\n`;
        });
        downloadCSV(csvContent, "DatosMetricas.csv");
      } else if(type === "tasks") {
        csvContent += "Fecha Creacion,Hora Cracion,Tarea,Rol,Cuadrante,Completado,Fecha Fin, Hora Fin\n";
        tasksLog.forEach(entry => {
          // Escapar comas en tarea o rol si existieran
          let tareaText = entry.tarea;
          if(tareaText.includes(',')) {
            tareaText = '"' + tareaText.replace(/"/g,'""') + '"';
          }
          let rolText = entry.rol;
          if(rolText.includes(',')) {
            rolText = '"' + rolText.replace(/"/g,'""') + '"';
          }
          csvContent += `${entry.fechaCreacion},${tareaText},${rolText},${entry.cuadrante},${entry.completado},${entry.fechaFin}\n`;
        });
        downloadCSV(csvContent, "DatosTareas.csv");
      }
    }

    // Helper para descargar CSV
    function downloadCSV(csvContent, filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // === Función para renderizar la lista de roles ===
    function renderRoleList() {
      const rolesList = document.getElementById("rolesList");
      rolesList.innerHTML = ""; // Limpiar lista actual
      
      if(roles.length === 0) {
        rolesList.innerHTML = '<p class="text-sm text-gray-500">* No hay roles definidos *</p>';
        return;
      }
      
      roles.forEach((role, index) => {
        const roleItem = document.createElement("div");
        roleItem.className = "flex items-center justify-between bg-white p-2 rounded shadow-sm";
        roleItem.innerHTML = `
          <span class="text-sm">${role}</span>
          <button onclick="deleteRole(${index})" class="text-red-500 hover:text-red-700">
            🗑️
          </button>
        `;
        rolesList.appendChild(roleItem);
      });
    }

    // === Función para eliminar un rol ===
    function deleteRole(index) {
      const roleToDelete = roles[index];
      // Verificar si hay tareas asociadas a este rol
      const tasksForRole = tasks.filter(t => t.role === roleToDelete && t.completado !== 'ELIMINADO');
      
      if(tasksForRole.length > 0) {
        if(!confirm(`⚠️ El rol "${roleToDelete}" tiene ${tasksForRole.length} tarea(s) pendiente(s). ¿Estás seguro que deseas eliminar este rol? Las tareas asociadas también se eliminarán.`)) {
          return;
        }
      } else {
        if(!confirm(`¿Estás seguro que deseas eliminar el rol "${roleToDelete}"?`)) {
          return;
        }
      }
      
      // Eliminar el rol
      roles.splice(index, 1);
      localStorage.setItem("habitus_roles", JSON.stringify(roles));
      
      // Eliminar tareas asociadas a este rol
      tasks = tasks.filter(t => t.role !== roleToDelete);
      localStorage.setItem("habitus_tasks", JSON.stringify(tasks));
      
      // Actualizar vistas
      updateRoleOptions();
      renderViews();
    }

    // === Función para migrar datos existentes ===
    window.migrateExistingData = function() {
      try {
        // Get current language
        const currentLanguage = localStorage.getItem("habitus_lang") || "es";
        
        // Get existing data from localStorage with correct keys
        const storedMetrics = localStorage.getItem('habitus_metrics');
        const storedTasks = localStorage.getItem('habitus_tasks');
        const storedTasksLog = localStorage.getItem('habitus_tasksLog');

        let hasChanges = false;

        // Migrate metrics
        if (storedMetrics) {
          const metrics = JSON.parse(storedMetrics);
          const updatedMetrics = metrics.map(metric => {
            if (metric.fecha && !metric.fecha.includes('T')) {
              try {
                const date = new Date(metric.fecha);
                if (!isNaN(date.getTime())) {
                  metric.fecha = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating metric date:', e);
              }
            }
            return metric;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_metrics', JSON.stringify(updatedMetrics));
          }
        }

        // Migrate tasks
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          const updatedTasks = tasks.map(task => {
            if (task.createdDate && !task.createdDate.includes('T')) {
              try {
                const date = new Date(task.createdDate);
                if (!isNaN(date.getTime())) {
                  task.createdDate = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task createdDate:', e);
              }
            }
            if (task.completedDate && !task.completedDate.includes('T')) {
              try {
                const date = new Date(task.completedDate);
                if (!isNaN(date.getTime())) {
                  task.completedDate = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task completedDate:', e);
              }
            }
            return task;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_tasks', JSON.stringify(updatedTasks));
          }
        }

        // Migrate tasks log
        if (storedTasksLog) {
          const tasksLog = JSON.parse(storedTasksLog);
          const updatedTasksLog = tasksLog.map(log => {
            if (log.fechaCreacion && !log.fechaCreacion.includes('T')) {
              try {
                const date = new Date(log.fechaCreacion);
                if (!isNaN(date.getTime())) {
                  log.fechaCreacion = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task log fechaCreacion:', e);
              }
            }
            if (log.fechaFin && !log.fechaFin.includes('T')) {
              try {
                const date = new Date(log.fechaFin);
                if (!isNaN(date.getTime())) {
                  log.fechaFin = date.toISOString();
                  hasChanges = true;
                }
              } catch (e) {
                console.error('Error migrating task log fechaFin:', e);
              }
            }
            return log;
          });
          if (hasChanges) {
            localStorage.setItem('habitus_tasksLog', JSON.stringify(updatedTasksLog));
          }
        }

        if (hasChanges) {
          // Reload data and refresh views
          loadData();
          renderViews();
          initCharts();
          alert(currentLanguage === 'es' ? 'Datos migrados exitosamente' : 'Data migrated successfully');
        } else {
          alert(currentLanguage === 'es' ? 'No se encontraron datos para migrar' : 'No data found to migrate');
        }
      } catch (error) {
        console.error('Error during migration:', error);
        const currentLanguage = localStorage.getItem("habitus_lang") || "es";
        alert(currentLanguage === 'es' ? 'Error durante la migración' : 'Error during migration');
      }
    };

    // === Inicializar la aplicación al cargar la página ===
    document.addEventListener('DOMContentLoaded', () => {
      // Registrar Service Worker con ruta relativa
      if ('serviceWorker' in navigator) {
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        navigator.serviceWorker.register(basePath + 'sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful');
          })
          .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
          });
      }

      renderRoleList();
      // Asegurarse de que el botón tenga el event listener correcto
      const addRoleBtn = document.getElementById("addRoleBtn");
      addRoleBtn.onclick = addRole;  // Usar onclick en lugar de addEventListener para evitar duplicados
      
      // Iniciar gráficos con datos actuales
      initCharts();
      // Renderizar vistas iniciales
      renderViews();
    });
