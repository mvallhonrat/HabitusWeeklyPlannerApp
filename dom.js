function renderViews() {
      const rolesDiv = document.getElementById("rolesView");
      const quadsDiv = document.getElementById("quadrantsView");
      let rolesHTML = "";
      let quadsHTML = "";

      // Construir vista por Roles
      if(roles.length === 0) {
        rolesHTML += '<p class="text-sm text-gray-500">* Agrega un rol para comenzar *</p>';
      }

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