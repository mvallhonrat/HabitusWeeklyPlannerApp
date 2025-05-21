/**
 * Tasks Module
 * Handles task management for the application
 */
const Tasks = (() => {
    // Private state
    let tasks = [];
    let currentView = 'roles'; // 'roles' or 'quadrants'

    // DOM Elements
    const elements = {
        taskInput: null,
        roleSelect: null,
        quadrantSelect: null,
        addTaskBtn: null,
        rolesView: null,
        quadrantsView: null,
        tabRoles: null,
        tabQuadrants: null,
        reviewInput: null,
        newWeekBtn: null,
        exportMetricsBtn: null,
        exportTasksBtn: null,
        lastReviewBox: null,
        lastReviewText: null,
        totalTasks: null,
        completionPercentage: null,
        q1Count: null,
        q2Count: null,
        q3Count: null,
        q4Count: null
    };

    // Chart instances
    let quadrantsChart = null;
    let completionChart = null;

    // Initialize module
    function init() {
        // Cache DOM elements
        elements.taskInput = document.getElementById('taskInput');
        elements.roleSelect = document.getElementById('roleSelect');
        elements.quadrantSelect = document.getElementById('quadrantSelect');
        elements.addTaskBtn = document.getElementById('addTaskBtn');
        elements.rolesView = document.getElementById('rolesView');
        elements.quadrantsView = document.getElementById('quadrantsView');
        elements.tabRoles = document.getElementById('tabRoles');
        elements.tabQuadrants = document.getElementById('tabQuadrants');
        elements.reviewInput = document.getElementById('reviewInput');
        elements.newWeekBtn = document.getElementById('newWeekBtn');
        elements.exportMetricsBtn = document.getElementById('exportMetricsBtn');
        elements.exportTasksBtn = document.getElementById('exportTasksBtn');
        elements.lastReviewBox = document.getElementById('lastReviewBox');
        elements.lastReviewText = document.getElementById('lastReviewText');
        elements.totalTasks = document.getElementById('totalTasks');
        elements.completionPercentage = document.getElementById('completionPercentage');
        elements.q1Count = document.getElementById('q1Count');
        elements.q2Count = document.getElementById('q2Count');
        elements.q3Count = document.getElementById('q3Count');
        elements.q4Count = document.getElementById('q4Count');

        // Load tasks from storage
        loadTasks();

        // Set up event listeners
        setupEventListeners();

        // Initialize charts
        initCharts();

        // Update UI
        updateUI();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Add task button click
        elements.addTaskBtn?.addEventListener('click', () => {
            const taskData = {
                description: elements.taskInput?.value.trim(),
                roleId: elements.roleSelect?.value,
                quadrant: elements.quadrantSelect?.value
            };
            if (taskData.description && taskData.roleId && taskData.quadrant) {
                addTask(taskData);
                elements.taskInput.value = '';
                elements.roleSelect.value = '';
                elements.quadrantSelect.value = '';
            } else {
                const errorMsg = Translations.getTranslation('errors.invalid_task');
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: errorMsg, type: 'error' }
                }));
            }
        });

        // Add task on Enter key
        elements.taskInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const taskData = {
                    description: elements.taskInput.value.trim(),
                    roleId: elements.roleSelect.value,
                    quadrant: elements.quadrantSelect.value
                };
                if (taskData.description && taskData.roleId && taskData.quadrant) {
                    addTask(taskData);
                    elements.taskInput.value = '';
                    elements.roleSelect.value = '';
                    elements.quadrantSelect.value = '';
                }
            }
        });

        // Tab switching
        elements.tabRoles?.addEventListener('click', () => switchView('roles'));
        elements.tabQuadrants?.addEventListener('click', () => switchView('quadrants'));

        // New week button
        elements.newWeekBtn?.addEventListener('click', startNewWeek);

        // Export buttons
        elements.exportMetricsBtn?.addEventListener('click', exportMetrics);
        elements.exportTasksBtn?.addEventListener('click', exportTasks);

        // Listen for role changes
        window.addEventListener('roleAdded', () => updateUI());
        window.addEventListener('roleDeleted', (e) => {
            const { roleId } = e.detail;
            deleteTasksByRole(roleId);
        });

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            updateUI();
            updateCharts();
        });
    }

    // Load tasks from storage
    function loadTasks() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            tasks = [];
        }
    }

    // Save tasks to storage
    function saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    // Add a new task
    function addTask(taskData) {
        // Create new task
        const newTask = {
            id: Date.now().toString(),
            description: taskData.description,
            roleId: taskData.roleId,
            quadrant: parseInt(taskData.quadrant),
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Add to tasks array
        tasks.push(newTask);

        // Save to storage
        saveTasks();

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.task_added');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch task added event
        window.dispatchEvent(new CustomEvent('taskAdded', {
            detail: { task: newTask }
        }));
    }

    // Delete a task
    function deleteTask(taskId) {
        // Find task index
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        // Remove task
        tasks.splice(taskIndex, 1);

        // Save to storage
        saveTasks();

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.task_deleted');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch task deleted event
        window.dispatchEvent(new CustomEvent('taskDeleted', {
            detail: { taskId }
        }));
    }

    // Delete tasks by role
    function deleteTasksByRole(roleId) {
        tasks = tasks.filter(task => task.roleId !== roleId);
        saveTasks();
        updateUI();
    }

    // Toggle task completion
    function toggleTaskCompletion(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        // Save to storage
        saveTasks();

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.task_completed');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch task updated event
        window.dispatchEvent(new CustomEvent('taskUpdated', {
            detail: { task }
        }));
    }

    // Switch view between roles and quadrants
    function switchView(view) {
        if (view !== 'roles' && view !== 'quadrants') return;
        currentView = view;

        // Update tab styles
        if (elements.tabRoles && elements.tabQuadrants) {
            elements.tabRoles.className = `flex-1 px-3 py-3 text-sm font-medium ${
                view === 'roles' 
                    ? 'text-gray-700 dark:text-gray-300 border-b-2 border-primary-500' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent'
            } touch-manipulation focus-visible`;
            elements.tabQuadrants.className = `flex-1 px-3 py-3 text-sm font-medium ${
                view === 'quadrants' 
                    ? 'text-gray-700 dark:text-gray-300 border-b-2 border-primary-500' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent'
            } touch-manipulation focus-visible`;
        }

        // Show/hide views
        if (elements.rolesView && elements.quadrantsView) {
            elements.rolesView.classList.toggle('hidden', view !== 'roles');
            elements.quadrantsView.classList.toggle('hidden', view !== 'quadrants');
        }

        // Update UI
        updateUI();
    }

    // Start a new week
    function startNewWeek() {
        // Save current review
        const review = elements.reviewInput?.value.trim();
        if (review) {
            localStorage.setItem('lastReview', review);
            elements.lastReviewBox?.classList.remove('hidden');
            elements.lastReviewText.textContent = review;
        }

        // Clear completed tasks
        tasks = tasks.filter(task => !task.completed);

        // Save to storage
        saveTasks();

        // Clear review input
        if (elements.reviewInput) {
            elements.reviewInput.value = '';
        }

        // Update UI
        updateUI();

        // Notify success
        const successMsg = Translations.getTranslation('notifications.new_week_started');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));

        // Dispatch new week event
        window.dispatchEvent(new CustomEvent('newWeekStarted'));
    }

    // Export metrics
    function exportMetrics() {
        try {
            const metrics = {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(task => task.completed).length,
                tasksByQuadrant: {
                    1: tasks.filter(task => task.quadrant === 1).length,
                    2: tasks.filter(task => task.quadrant === 2).length,
                    3: tasks.filter(task => task.quadrant === 3).length,
                    4: tasks.filter(task => task.quadrant === 4).length
                },
                tasksByRole: tasks.reduce((acc, task) => {
                    const role = Roles.getRoleById(task.roleId);
                    if (role) {
                        acc[role.name] = (acc[role.name] || 0) + 1;
                    }
                    return acc;
                }, {}),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habitus-metrics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Notify success
            const successMsg = Translations.getTranslation('notifications.export_success');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: successMsg, type: 'success' }
            }));
        } catch (error) {
            console.error('Error exporting metrics:', error);
            const errorMsg = Translations.getTranslation('notifications.export_error');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: errorMsg, type: 'error' }
            }));
        }
    }

    // Export tasks
    function exportTasks() {
        try {
            const exportData = tasks.map(task => ({
                ...task,
                role: Roles.getRoleById(task.roleId)?.name || 'Unknown'
            }));

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habitus-tasks-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Notify success
            const successMsg = Translations.getTranslation('notifications.export_success');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: successMsg, type: 'success' }
            }));
        } catch (error) {
            console.error('Error exporting tasks:', error);
            const errorMsg = Translations.getTranslation('notifications.export_error');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: errorMsg, type: 'error' }
            }));
        }
    }

    // Initialize charts
    function initCharts() {
        // Quadrants chart
        const quadrantsCtx = document.getElementById('chartQuadrants')?.getContext('2d');
        if (quadrantsCtx) {
            quadrantsChart = new Chart(quadrantsCtx, {
                type: 'bar',
                data: {
                    labels: [
                        Translations.getTranslation('quadrant_1'),
                        Translations.getTranslation('quadrant_2'),
                        Translations.getTranslation('quadrant_3'),
                        Translations.getTranslation('quadrant_4')
                    ],
                    datasets: [{
                        label: Translations.getTranslation('tasks_by_quadrant'),
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.5)',  // red-500
                            'rgba(34, 197, 94, 0.5)',  // green-500
                            'rgba(234, 179, 8, 0.5)',  // yellow-500
                            'rgba(59, 130, 246, 0.5)'  // blue-500
                        ],
                        borderColor: [
                            'rgb(239, 68, 68)',    // red-500
                            'rgb(34, 197, 94)',    // green-500
                            'rgb(234, 179, 8)',    // yellow-500
                            'rgb(59, 130, 246)'    // blue-500
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Completion chart
        const completionCtx = document.getElementById('chartCompletion')?.getContext('2d');
        if (completionCtx) {
            completionChart = new Chart(completionCtx, {
                type: 'doughnut',
                data: {
                    labels: [
                        Translations.getTranslation('completed_tasks'),
                        Translations.getTranslation('pending_tasks')
                    ],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.5)',  // green-500
                            'rgba(239, 68, 68, 0.5)'   // red-500
                        ],
                        borderColor: [
                            'rgb(34, 197, 94)',    // green-500
                            'rgb(239, 68, 68)'     // red-500
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // Update charts
    function updateCharts() {
        if (quadrantsChart) {
            // Update quadrants chart data
            const quadrantData = [1, 2, 3, 4].map(q => 
                tasks.filter(task => task.quadrant === q).length
            );
            quadrantsChart.data.datasets[0].data = quadrantData;
            quadrantsChart.data.labels = [
                Translations.getTranslation('quadrant_1'),
                Translations.getTranslation('quadrant_2'),
                Translations.getTranslation('quadrant_3'),
                Translations.getTranslation('quadrant_4')
            ];
            quadrantsChart.update();
        }

        if (completionChart) {
            // Update completion chart data
            const completed = tasks.filter(task => task.completed).length;
            const pending = tasks.length - completed;
            completionChart.data.datasets[0].data = [completed, pending];
            completionChart.data.labels = [
                Translations.getTranslation('completed_tasks'),
                Translations.getTranslation('pending_tasks')
            ];
            completionChart.update();
        }
    }

    // Update UI
    function updateUI() {
        // Update task views
        updateTaskViews();

        // Update metrics
        updateMetrics();

        // Update charts
        updateCharts();

        // Apply translations
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = Translations.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    // Update task views
    function updateTaskViews() {
        if (!elements.rolesView || !elements.quadrantsView) return;

        // Clear views
        elements.rolesView.innerHTML = '';
        elements.quadrantsView.innerHTML = '';

        if (currentView === 'roles') {
            // Group tasks by role
            const tasksByRole = tasks.reduce((acc, task) => {
                const role = Roles.getRoleById(task.roleId);
                if (role) {
                    if (!acc[role.id]) {
                        acc[role.id] = {
                            role,
                            tasks: []
                        };
                    }
                    acc[role.id].tasks.push(task);
                }
                return acc;
            }, {});

            // Create role sections
            Object.values(tasksByRole).forEach(({ role, tasks: roleTasks }) => {
                const roleSection = document.createElement('div');
                roleSection.className = 'mb-6';
                roleSection.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">${role.name}</h3>
                    <div class="space-y-2">
                        ${roleTasks.map(task => createTaskElement(task)).join('')}
                    </div>
                `;
                elements.rolesView.appendChild(roleSection);
            });
        } else {
            // Group tasks by quadrant
            const tasksByQuadrant = tasks.reduce((acc, task) => {
                if (!acc[task.quadrant]) {
                    acc[task.quadrant] = [];
                }
                acc[task.quadrant].push(task);
                return acc;
            }, {});

            // Create quadrant sections
            [1, 2, 3, 4].forEach(quadrant => {
                const quadrantTasks = tasksByQuadrant[quadrant] || [];
                const quadrantSection = document.createElement('div');
                quadrantSection.className = 'mb-6';
                quadrantSection.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200" data-i18n="quadrant_${quadrant}">
                        ${Translations.getTranslation(`quadrant_${quadrant}`)}
                    </h3>
                    <div class="space-y-2">
                        ${quadrantTasks.map(task => createTaskElement(task)).join('')}
                    </div>
                `;
                elements.quadrantsView.appendChild(quadrantSection);
            });
        }
    }

    // Create task element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-2 relative group';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        // Add drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.style.width = '20px';
        dragHandle.style.height = '20px';
        dragHandle.style.display = 'flex';
        dragHandle.style.alignItems = 'center';
        dragHandle.style.justifyContent = 'center';
        
        // Task content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'pl-8'; // Add padding for drag handle
        
        // Task description
        const description = document.createElement('p');
        description.className = `text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`;
        description.textContent = task.description;
        
        // Task metadata
        const metadata = document.createElement('div');
        metadata.className = 'flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400';
        
        // Role badge
        const roleBadge = document.createElement('span');
        roleBadge.className = 'role-badge px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
        roleBadge.textContent = Roles.getRoleName(task.roleId);
        roleBadge.dataset.roleId = task.roleId;
        
        // Quadrant badge
        const quadrantBadge = document.createElement('span');
        quadrantBadge.className = 'quadrant-badge px-2 py-1 rounded-full ml-2';
        quadrantBadge.textContent = `Q${task.quadrant}`;
        quadrantBadge.dataset.quadrant = task.quadrant;
        
        // Set quadrant badge color
        switch(task.quadrant) {
            case 1:
                quadrantBadge.classList.add('bg-red-100', 'dark:bg-red-900', 'text-red-800', 'dark:text-red-200');
                break;
            case 2:
                quadrantBadge.classList.add('bg-yellow-100', 'dark:bg-yellow-900', 'text-yellow-800', 'dark:text-yellow-200');
                break;
            case 3:
                quadrantBadge.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
                break;
            case 4:
                quadrantBadge.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
                break;
        }
        
        // Completion checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox mr-2';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Assemble task element
        metadata.appendChild(roleBadge);
        metadata.appendChild(quadrantBadge);
        contentContainer.appendChild(description);
        contentContainer.appendChild(metadata);
        taskElement.appendChild(dragHandle);
        taskElement.appendChild(checkbox);
        taskElement.appendChild(contentContainer);
        taskElement.appendChild(deleteBtn);
        
        // Add drag and drop event listeners
        setupDragAndDrop(taskElement, task);
        
        return taskElement;
    }

    // Setup drag and drop for a task element
    function setupDragAndDrop(taskElement, task) {
        // Drag start
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('opacity-50');
            
            // Add dragging class to body for global styles
            document.body.classList.add('dragging');
        });
        
        // Drag end
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('opacity-50');
            document.body.classList.remove('dragging');
        });
        
        // Make role and quadrant badges drop targets
        const roleBadge = taskElement.querySelector('.role-badge');
        const quadrantBadge = taskElement.querySelector('.quadrant-badge');
        
        // Role badge drop handling
        roleBadge.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            roleBadge.classList.add('bg-blue-200', 'dark:bg-blue-800');
        });
        
        roleBadge.addEventListener('dragleave', () => {
            roleBadge.classList.remove('bg-blue-200', 'dark:bg-blue-800');
        });
        
        roleBadge.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            roleBadge.classList.remove('bg-blue-200', 'dark:bg-blue-800');
            
            const draggedTaskId = e.dataTransfer.getData('text/plain');
            const newRoleId = roleBadge.dataset.roleId;
            
            if (draggedTaskId !== task.id) {
                updateTaskRole(draggedTaskId, newRoleId);
            }
        });
        
        // Quadrant badge drop handling
        quadrantBadge.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            quadrantBadge.classList.add('ring-2', 'ring-offset-2', 'ring-current');
        });
        
        quadrantBadge.addEventListener('dragleave', () => {
            quadrantBadge.classList.remove('ring-2', 'ring-offset-2', 'ring-current');
        });
        
        quadrantBadge.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            quadrantBadge.classList.remove('ring-2', 'ring-offset-2', 'ring-current');
            
            const draggedTaskId = e.dataTransfer.getData('text/plain');
            const newQuadrant = parseInt(quadrantBadge.dataset.quadrant);
            
            if (draggedTaskId !== task.id) {
                updateTaskQuadrant(draggedTaskId, newQuadrant);
            }
        });
    }

    // Update task role
    function updateTaskRole(taskId, newRoleId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        tasks[taskIndex].roleId = newRoleId;
        saveTasks();
        updateUI();
        
        // Notify success
        const successMsg = Translations.getTranslation('notifications.task_updated');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));
    }

    // Update task quadrant
    function updateTaskQuadrant(taskId, newQuadrant) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        tasks[taskIndex].quadrant = newQuadrant;
        saveTasks();
        updateUI();
        
        // Notify success
        const successMsg = Translations.getTranslation('notifications.task_updated');
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: successMsg, type: 'success' }
        }));
    }

    // Update metrics
    function updateMetrics() {
        // Update total tasks
        if (elements.totalTasks) {
            elements.totalTasks.textContent = tasks.length;
        }

        // Update completion percentage
        if (elements.completionPercentage) {
            const completed = tasks.filter(task => task.completed).length;
            const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
            elements.completionPercentage.textContent = `${percentage}%`;
        }

        // Update quadrant counts
        if (elements.q1Count) elements.q1Count.textContent = tasks.filter(task => task.quadrant === 1).length;
        if (elements.q2Count) elements.q2Count.textContent = tasks.filter(task => task.quadrant === 2).length;
        if (elements.q3Count) elements.q3Count.textContent = tasks.filter(task => task.quadrant === 3).length;
        if (elements.q4Count) elements.q4Count.textContent = tasks.filter(task => task.quadrant === 4).length;
    }

    // Get all tasks
    function getAllTasks() {
        return [...tasks];
    }

    // Get tasks by role
    function getTasksByRole(roleId) {
        return tasks.filter(task => task.roleId === roleId);
    }

    // Get tasks by quadrant
    function getTasksByQuadrant(quadrant) {
        return tasks.filter(task => task.quadrant === quadrant);
    }

    // Get completed tasks
    function getCompletedTasks() {
        return tasks.filter(task => task.completed);
    }

    // Get pending tasks
    function getPendingTasks() {
        return tasks.filter(task => !task.completed);
    }

    // Public API
    return {
        init,
        addTask,
        deleteTask,
        toggleTaskCompletion,
        switchView,
        startNewWeek,
        exportMetrics,
        exportTasks,
        getAllTasks,
        getTasksByRole,
        getTasksByQuadrant,
        getCompletedTasks,
        getPendingTasks
    };
})();

// Initialize tasks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Tasks.init();
}); 