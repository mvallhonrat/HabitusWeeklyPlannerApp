/**
 * Roles Module
 * Handles role management for the application
 */
const Roles = (() => {
    // Private state
    let roles = [];
    let activeRoleId = null;

    // DOM Elements
    const elements = {
        roleInput: null,
        addRoleBtn: null,
        rolesList: null,
        roleSelect: null
    };

    // Initialize module
    function init() {
        // Cache DOM elements
        elements.roleInput = document.getElementById('roleInput');
        elements.addRoleBtn = document.getElementById('addRoleBtn');
        elements.rolesList = document.getElementById('rolesList');
        elements.roleSelect = document.getElementById('roleSelect');

        // Load roles from storage
        loadRoles();

        // Set up event listeners
        setupEventListeners();

        // Update UI
        updateUI();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Add role button click
        elements.addRoleBtn?.addEventListener('click', () => {
            const roleName = elements.roleInput?.value.trim();
            if (roleName) {
                addRole(roleName);
                elements.roleInput.value = '';
            }
        });

        // Add role on Enter key
        elements.roleInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const roleName = elements.roleInput.value.trim();
                if (roleName) {
                    addRole(roleName);
                    elements.roleInput.value = '';
                }
            }
        });

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            updateUI();
        });
    }

    // Load roles from storage
    function loadRoles() {
        try {
            const storedRoles = localStorage.getItem('roles');
            if (storedRoles) {
                roles = JSON.parse(storedRoles);
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            roles = [];
        }
    }

    // Save roles to storage
    function saveRoles() {
        try {
            localStorage.setItem('roles', JSON.stringify(roles));
        } catch (error) {
            console.error('Error saving roles:', error);
        }
    }

    // Add a new role
    function addRole(name) {
        // Validate role name
        if (!name || roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
            const errorMsg = Translations.getTranslation('errors.role_exists');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: errorMsg, type: 'error' }
            }));
            return;
        }

        // Create new role
        const newRole = {
            id: Date.now().toString(),
            name: name,
            createdAt: new Date().toISOString()
        };

        // Add to roles array
        roles.push(newRole);

        // Save to storage
        saveRoles();

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.role_added');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch role added event
        window.dispatchEvent(new CustomEvent('roleAdded', {
            detail: { role: newRole }
        }));
    }

    // Delete a role
    function deleteRole(roleId) {
        // Find role index
        const roleIndex = roles.findIndex(role => role.id === roleId);
        if (roleIndex === -1) return;

        // Remove role
        roles.splice(roleIndex, 1);

        // Save to storage
        saveRoles();

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.role_deleted');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch role deleted event
        window.dispatchEvent(new CustomEvent('roleDeleted', {
            detail: { roleId }
        }));
    }

    // Update UI
    function updateUI() {
        if (!elements.rolesList || !elements.roleSelect) return;

        // Clear existing content
        elements.rolesList.innerHTML = '';
        elements.roleSelect.innerHTML = '<option disabled selected value="">Rol</option>';

        // Add roles to list
        roles.forEach(role => {
            // Add to roles list
            const roleElement = document.createElement('div');
            roleElement.className = 'flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700';
            roleElement.innerHTML = `
                <span class="text-gray-800 dark:text-gray-200">${role.name}</span>
                <button 
                    class="text-red-500 hover:text-red-700 dark:hover:text-red-400 focus-visible p-1" 
                    data-i18n="delete_role"
                    onclick="Roles.deleteRole('${role.id}')"
                >
                    🗑️
                </button>
            `;
            elements.rolesList.appendChild(roleElement);

            // Add to role select
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            elements.roleSelect.appendChild(option);
        });

        // Update active roles count
        const activeRolesElement = document.getElementById('activeRoles');
        if (activeRolesElement) {
            activeRolesElement.textContent = roles.length;
        }

        // Apply translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = Translations.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    // Get all roles
    function getAllRoles() {
        return [...roles];
    }

    // Get role by ID
    function getRoleById(roleId) {
        return roles.find(role => role.id === roleId);
    }

    // Get role by name
    function getRoleByName(name) {
        return roles.find(role => role.name.toLowerCase() === name.toLowerCase());
    }

    // Set active role
    function setActiveRole(roleId) {
        activeRoleId = roleId;
        window.dispatchEvent(new CustomEvent('activeRoleChanged', {
            detail: { roleId }
        }));
    }

    // Get active role
    function getActiveRole() {
        return activeRoleId ? getRoleById(activeRoleId) : null;
    }

    // Public API
    return {
        init,
        addRole,
        deleteRole,
        getAllRoles,
        getRoleById,
        getRoleByName,
        setActiveRole,
        getActiveRole
    };
})();

// Initialize roles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Roles.init();
}); 