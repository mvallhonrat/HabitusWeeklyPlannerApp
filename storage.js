function loadData() {
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

function updateRoleOptions() {
      const roleSelect = document.getElementById("roleSelect");
      // Limpiar opciones actuales (excepto placeholder)
      roleSelect.innerHTML = '<option value="" disabled selected>Rol</option>';
      roles.forEach(role => {
        const opt = document.createElement("option");
        opt.value = role;
        opt.textContent = role;
        roleSelect.appendChild(opt);
      }