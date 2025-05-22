/**
 * Tasks Module
 * Handles task management functionality
 */
const Tasks = (() => {
    // Private state
    let tasks = [];
    let metrics = [];
    let tasksLog = [];
    let lastReviewText = '';
    let lastResetTime = null;

    // Chart instances
    let chartQuadrants = null;
    let chartCompletion = null;
    let chartHistoricalCompletion = null;
    let chartHistoricalQuadrants = null;
    let chartHistoricalRoles = null;

    // DOM Elements
    const elements = {
        taskInput: null,
        roleSelect: null,
        quadrantSelect: null,
        addTaskBtn: null,
        rolesView: null,
        quadrantsView: null,
        reviewInput: null,
        newWeekBtn: null,
        tabRoles: null,
        tabQuadrants: null
    };

    // Add these variables at the top of your file
    let longPressTimer = null;
    let isLongPress = false;
    const LONG_PRESS_DURATION = 500; // 500ms for long press

    // Add these variables at the top of the Tasks module
    let draggedTask = null;
    let dragStartY = 0;
    let initialScrollY = 0;
    let ghostElement = null;

    // Initialize tasks module
    function init() {
        // Destroy existing charts before reinitializing
        destroyCharts();

        // Cache DOM elements
        elements.taskInput = document.getElementById('taskInput');
        elements.roleSelect = document.getElementById('roleSelect');
        elements.quadrantSelect = document.getElementById('quadrantSelect');
        elements.addTaskBtn = document.getElementById('addTaskBtn');
        elements.rolesView = document.getElementById('rolesView');
        elements.quadrantsView = document.getElementById('quadrantsView');
        elements.reviewInput = document.getElementById('reviewInput');
        elements.newWeekBtn = document.getElementById('newWeekBtn');
        elements.tabRoles = document.getElementById('tabRoles');
        elements.tabQuadrants = document.getElementById('tabQuadrants');

        // Load saved data
        loadData();

        // Set up event listeners
        setupEventListeners();

        // Initialize charts
        initCharts();

        // Update UI
        updateUI();

        // Show roles view by default
        showRoles();

        // Initialize drag and drop
        initDragAndDrop();

        // Add drag and drop event listeners to task lists
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                list.classList.add('drag-over');
            });
            
            list.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                list.classList.remove('drag-over');
            });
            
            list.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                list.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const task = tasks.find(t => t.id === taskId);
                if (!task) return;

                const targetId = list.id;
                if (targetId.startsWith('role-')) {
                    task.role = targetId.replace('role-', '');
                } else if (targetId.startsWith('quadrant-')) {
                    task.quadrant = targetId.replace('quadrant-', '');
                }

                saveData();
                updateUI();
            });
        });
    }

    // Destroy existing charts
    function destroyCharts() {
        if (chartQuadrants) {
            chartQuadrants.destroy();
            chartQuadrants = null;
        }
        if (chartCompletion) {
            chartCompletion.destroy();
            chartCompletion = null;
        }
        if (chartHistoricalCompletion) {
            chartHistoricalCompletion.destroy();
            chartHistoricalCompletion = null;
        }
        if (chartHistoricalQuadrants) {
            chartHistoricalQuadrants.destroy();
            chartHistoricalQuadrants = null;
        }
        if (chartHistoricalRoles) {
            chartHistoricalRoles.destroy();
            chartHistoricalRoles = null;
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Add task button
        if (elements.addTaskBtn) {
            elements.addTaskBtn.addEventListener('click', addTask);
        }

        // Task input enter key
        if (elements.taskInput) {
            elements.taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
        }

        // New week button
        if (elements.newWeekBtn) {
            elements.newWeekBtn.addEventListener('click', startNewWeek);
        }

        // Review input change
        if (elements.reviewInput) {
            elements.reviewInput.addEventListener('change', saveReview);
        }

        // Tab buttons
        if (elements.tabRoles) {
            elements.tabRoles.addEventListener('click', showRoles);
        }
        if (elements.tabQuadrants) {
            elements.tabQuadrants.addEventListener('click', showQuadrants);
        }
    }

    // Show roles view
    function showRoles() {
        if (elements.rolesView && elements.quadrantsView && elements.tabRoles && elements.tabQuadrants) {
            elements.rolesView.classList.remove('hidden');
            elements.quadrantsView.classList.add('hidden');
            elements.tabRoles.classList.add('border-indigo-500', 'text-gray-700');
            elements.tabRoles.classList.remove('border-transparent', 'text-gray-600');
            elements.tabQuadrants.classList.add('border-transparent', 'text-gray-600');
            elements.tabQuadrants.classList.remove('border-indigo-500', 'text-gray-700');
        }
    }

    // Show quadrants view
    function showQuadrants() {
        if (elements.rolesView && elements.quadrantsView && elements.tabRoles && elements.tabQuadrants) {
            elements.rolesView.classList.add('hidden');
            elements.quadrantsView.classList.remove('hidden');
            elements.tabQuadrants.classList.add('border-indigo-500', 'text-gray-700');
            elements.tabQuadrants.classList.remove('border-transparent', 'text-gray-600');
            elements.tabRoles.classList.add('border-transparent', 'text-gray-600');
            elements.tabRoles.classList.remove('border-indigo-500', 'text-gray-700');
        }
    }

    // Load data from localStorage
    function loadData() {
        const storedTasks = localStorage.getItem('habitus_tasks');
        const storedMetrics = localStorage.getItem('habitus_metrics');
        const storedTasksLog = localStorage.getItem('habitus_tasksLog');
        const storedLastReview = localStorage.getItem('habitus_lastReview');
        const storedLastReset = localStorage.getItem('habitus_lastReset');

        if (storedTasks) tasks = JSON.parse(storedTasks);
        if (storedMetrics) metrics = JSON.parse(storedMetrics);
        if (storedTasksLog) tasksLog = JSON.parse(storedTasksLog);
        if (storedLastReview) lastReviewText = storedLastReview;
        if (storedLastReset) lastResetTime = parseInt(storedLastReset);

        // Show last review if exists
        if (lastReviewText && lastReviewText.trim() !== '') {
            const lastReviewBox = document.getElementById('lastReviewBox');
            const lastReviewSpan = document.getElementById('lastReviewText');
            if (lastReviewBox && lastReviewSpan) {
                lastReviewBox.classList.remove('hidden');
                lastReviewSpan.textContent = lastReviewText;
            }
        }
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem('habitus_tasks', JSON.stringify(tasks));
        localStorage.setItem('habitus_metrics', JSON.stringify(metrics));
        localStorage.setItem('habitus_tasksLog', JSON.stringify(tasksLog));
        localStorage.setItem('habitus_lastReview', lastReviewText);
        localStorage.setItem('habitus_lastReset', JSON.stringify(lastResetTime));
    }

    // Initialize charts
    function initCharts() {
        const ctxQ = document.getElementById('chartQuadrants')?.getContext('2d');
        const ctxC = document.getElementById('chartCompletion')?.getContext('2d');
        const ctxHC = document.getElementById('chartHistoricalCompletion')?.getContext('2d');
        const ctxHQ = document.getElementById('chartHistoricalQuadrants')?.getContext('2d');
        const ctxHR = document.getElementById('chartHistoricalRoles')?.getContext('2d');

        if (ctxQ) {
            chartQuadrants = new Chart(ctxQ, {
                type: 'bar',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                        label: 'Tareas',
                        data: countTasksByQuadrant(),
                        backgroundColor: ['#ef4444', '#22c55e', '#eab308', '#9ca3af']
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
        }

        if (ctxC) {
            chartCompletion = new Chart(ctxC, {
                type: 'doughnut',
                data: {
                    labels: [Translations.getTranslation('metric_completed'), Translations.getTranslation('metric_pending')],
                    datasets: [{
                        data: countCompletedPending(),
                        backgroundColor: ['#4ade80', '#f87171']
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
        }

        // Initialize historical charts
        const historicalData = prepareHistoricalData();

        if (ctxHC) {
            chartHistoricalCompletion = new Chart(ctxHC, {
                type: 'line',
                data: {
                    labels: historicalData.labels,
                    datasets: [{
                        label: Translations.getTranslation('metric_percent'),
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
        }

        if (ctxHQ) {
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
        }

        if (ctxHR) {
            chartHistoricalRoles = new Chart(ctxHR, {
                type: 'line',
                data: {
                    labels: historicalData.labels,
                    datasets: [{
                        label: Translations.getTranslation('metric_roles'),
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
        }
    }

    // Update UI
    function updateUI() {
        renderTasks();
        updateMetrics();
        updateCharts();
        updateHistoricalCharts();

        // Reinitialize drag and drop
        initDragAndDrop();
    }

    // Render tasks
    function renderTasks() {
        if (!elements.rolesView || !elements.quadrantsView) return;

        // Clear views
        elements.rolesView.innerHTML = '';
        elements.quadrantsView.innerHTML = '';

        // Get current roles
        const roles = Roles.getRoles();

        // Group tasks by role
        const tasksByRole = {};
        roles.forEach(role => {
            tasksByRole[role] = tasks.filter(task => task.role === role);
        });

        // Render roles view
        roles.forEach(role => {
            const roleTasks = tasksByRole[role] || [];
            const roleSection = document.createElement('div');
            roleSection.className = 'mb-4';
            roleSection.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">${role}</h3>
                <div class="task-list role-list space-y-2 min-h-[50px] p-2 rounded transition-colors" 
                     id="role-${role}"
                     data-type="role"
                     data-target="${role}">
                    ${roleTasks.length === 0 ? 
                        `<p class="text-sm text-gray-500">${Translations.getTranslation('no_tasks')}</p>` :
                        roleTasks.map((task, index) => renderTask(task, index)).join('')
                    }
                </div>
            `;
            elements.rolesView.appendChild(roleSection);
        });

        // Render quadrants view
        const quadrantLabels = {
            '1': 'QI',
            '2': 'QII',
            '3': 'QIII',
            '4': 'QIV'
        };

        for (let quadrant = 1; quadrant <= 4; quadrant++) {
            const quadrantTasks = tasks.filter(task => task.quadrant === quadrant.toString());
            const quadrantSection = document.createElement('div');
            quadrantSection.className = 'mb-4';
            quadrantSection.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">${quadrantLabels[quadrant]}</h3>
                <div class="task-list quadrant-list space-y-2 min-h-[50px] p-2 rounded transition-colors" 
                     id="quadrant-${quadrant}"
                     data-type="quadrant"
                     data-target="${quadrant}">
                    ${quadrantTasks.length === 0 ? 
                        `<p class="text-sm text-gray-500">${Translations.getTranslation('no_tasks')}</p>` :
                        quadrantTasks.map((task, index) => renderTask(task, index)).join('')
                    }
                </div>
            `;
            elements.quadrantsView.appendChild(quadrantSection);
        }

        // Initialize drag and drop after rendering
        initDragAndDrop();
    }

    // Initialize drag and drop
    function initDragAndDrop() {
        document.querySelectorAll('.task-item').forEach(taskElement => {
            const handle = taskElement.querySelector('.drag-handle');
            if (!handle) return;

            let isDragging = false;
            let ghostElement = null;
            let startY = 0;
            let startX = 0;
            let offsetY = 0;
            let originalScrollY = 0;

            function handleDrop(dropTarget) {
                if (!dropTarget || !dropTarget.classList.contains('task-list')) return;
                
                const taskId = taskElement.dataset.taskId;
                const task = tasks.find(t => t.id === taskId);
                if (!task) return;

                const targetType = dropTarget.dataset.type;
                const targetValue = dropTarget.dataset.target;
                
                if (targetType === 'role' && task.role !== targetValue) {
                    task.role = targetValue;
                    saveData();
                    updateUI();
                } else if (targetType === 'quadrant' && task.quadrant !== targetValue) {
                    task.quadrant = targetValue;
                    saveData();
                    updateUI();
                }
            }

            function findDropTarget(x, y) {
                const elements = document.elementsFromPoint(x, y);
                return elements.find(el => el.classList.contains('task-list'));
            }

            handle.addEventListener('touchstart', function(e) {
                if (e.target !== handle) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const touch = e.touches[0];
                const rect = taskElement.getBoundingClientRect();
                
                startY = touch.clientY;
                startX = touch.clientX;
                offsetY = touch.clientY - rect.top;
                originalScrollY = window.scrollY;
                
                // Create ghost
                ghostElement = taskElement.cloneNode(true);
                ghostElement.classList.add('task-ghost');
                ghostElement.style.position = 'fixed';
                ghostElement.style.width = `${rect.width}px`;
                ghostElement.style.height = `${rect.height}px`;
                ghostElement.style.left = `${rect.left}px`;
                ghostElement.style.top = `${rect.top}px`;
                document.body.appendChild(ghostElement);
                
                // Lock body scroll
                document.body.style.position = 'fixed';
                document.body.style.top = `-${originalScrollY}px`;
                document.body.style.width = '100%';
                document.body.style.overflow = 'hidden';
                
                isDragging = true;
                taskElement.classList.add('dragging');

                function onTouchMove(e) {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    const deltaY = touch.clientY - startY;
                    
                    // Update ghost position
                    const newTop = parseInt(ghostElement.style.top) + deltaY;
                    ghostElement.style.top = `${newTop}px`;
                    startY = touch.clientY;
                    
                    // Find and update drop target
                    const dropTarget = findDropTarget(touch.clientX, touch.clientY);
                    document.querySelectorAll('.task-list').forEach(el => {
                        el.classList.remove('drag-over');
                    });
                    if (dropTarget) {
                        dropTarget.classList.add('drag-over');
                    }
                }

                function onTouchEnd(e) {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const touch = e.changedTouches[0];
                    const dropTarget = findDropTarget(touch.clientX, touch.clientY);
                    
                    // Restore body scroll
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.width = '';
                    document.body.style.overflow = '';
                    window.scrollTo(0, originalScrollY);
                    
                    // Cleanup
                    isDragging = false;
                    taskElement.classList.remove('dragging');
                    if (ghostElement) {
                        ghostElement.remove();
                        ghostElement = null;
                    }
                    
                    // Remove event listeners
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                    document.removeEventListener('touchcancel', onTouchEnd);
                    
                    // Handle drop
                    handleDrop(dropTarget);
                    
                    // Cleanup drop targets
                    document.querySelectorAll('.task-list').forEach(el => {
                        el.classList.remove('drag-over');
                    });
                }

                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
                document.addEventListener('touchcancel', onTouchEnd);
            }, { passive: false });

            // Mouse events
            handle.addEventListener('mousedown', function(e) {
                if (e.target !== handle) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const rect = taskElement.getBoundingClientRect();
                startY = e.clientY;
                startX = e.clientX;
                offsetY = e.clientY - rect.top;
                
                // Create ghost
                ghostElement = taskElement.cloneNode(true);
                ghostElement.classList.add('task-ghost');
                ghostElement.style.position = 'fixed';
                ghostElement.style.width = `${rect.width}px`;
                ghostElement.style.height = `${rect.height}px`;
                ghostElement.style.left = `${rect.left}px`;
                ghostElement.style.top = `${rect.top}px`;
                document.body.appendChild(ghostElement);
                
                isDragging = true;
                taskElement.classList.add('dragging');

                function onMouseMove(e) {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const deltaY = e.clientY - startY;
                    
                    // Update ghost position
                    const newTop = parseInt(ghostElement.style.top) + deltaY;
                    ghostElement.style.top = `${newTop}px`;
                    startY = e.clientY;
                    
                    // Find and update drop target
                    const dropTarget = findDropTarget(e.clientX, e.clientY);
                    document.querySelectorAll('.task-list').forEach(el => {
                        el.classList.remove('drag-over');
                    });
                    if (dropTarget) {
                        dropTarget.classList.add('drag-over');
                    }
                }

                function onMouseUp(e) {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const dropTarget = findDropTarget(e.clientX, e.clientY);
                    
                    // Cleanup
                    isDragging = false;
                    taskElement.classList.remove('dragging');
                    if (ghostElement) {
                        ghostElement.remove();
                        ghostElement = null;
                    }
                    
                    // Remove event listeners
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    
                    // Handle drop
                    handleDrop(dropTarget);
                    
                    // Cleanup drop targets
                    document.querySelectorAll('.task-list').forEach(el => {
                        el.classList.remove('drag-over');
                    });
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    // Add a new task
    function addTask() {
        if (!elements.taskInput || !elements.roleSelect || !elements.quadrantSelect) return;

        const description = elements.taskInput.value.trim();
        const role = elements.roleSelect.value;
        const quadrant = elements.quadrantSelect.value;

        if (!description || !role || !quadrant) {
            App.showNotification(Translations.getTranslation('errors.invalid_task'), 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            description,
            role,
            quadrant,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        saveData();
        updateUI();

        // Clear inputs
        elements.taskInput.value = '';
        elements.roleSelect.value = '';
        elements.quadrantSelect.value = '';

        // Show success notification
        App.showNotification(Translations.getTranslation('notifications.task_added'), 'success');
    }

    // Toggle task completion
    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        saveData();
        updateUI();

        // Show success notification
        App.showNotification(
            task.completed ? 
                Translations.getTranslation('notifications.task_completed') :
                Translations.getTranslation('notifications.task_uncompleted'),
            'success'
        );
    }

    // Delete a task
    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        tasks.splice(taskIndex, 1);
        saveData();
        updateUI();

        // Show success notification
        App.showNotification(Translations.getTranslation('notifications.task_deleted'), 'success');
    }

    // Save review
    function saveReview() {
        if (!elements.reviewInput) return;

        lastReviewText = elements.reviewInput.value.trim();
        saveData();

        // Show success notification
        App.showNotification(Translations.getTranslation('notifications.review_saved'), 'success');
    }

    // Start new week
    function startNewWeek() {
        // Check if a week has passed since last reset
        if (lastResetTime) {
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            const timeSinceLastReset = Date.now() - lastResetTime;
            
            if (timeSinceLastReset < oneWeekInMs) {
                const daysLeft = Math.ceil((oneWeekInMs - timeSinceLastReset) / (24 * 60 * 60 * 1000));
                const message = Translations.getCurrentLanguage() === 'es' 
                    ? `Han pasado menos de 7 días desde la última vez. ¿Estás seguro de que quieres empezar una nueva semana? (Faltan ${daysLeft} días)`
                    : `Less than 7 days have passed since last time. Are you sure you want to start a new week? (${daysLeft} days left)`;
                
                if (!confirm(message)) {
                    return;
                }
            }
        }

        // Save current review text as last review if it exists
        if (elements.reviewInput && elements.reviewInput.value.trim()) {
            lastReviewText = elements.reviewInput.value.trim();
            const lastReviewBox = document.getElementById('lastReviewBox');
            const lastReviewSpan = document.getElementById('lastReviewText');
            if (lastReviewBox && lastReviewSpan) {
                lastReviewBox.classList.remove('hidden');
                lastReviewSpan.textContent = lastReviewText;
            }
        }

        // Save current week's data
        const weekMetrics = {
            timestamp: Date.now(),
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            activeRoles: Roles.getRoles().length,
            quadrants: countTasksByQuadrant()
        };
        metrics.push(weekMetrics);

        // Log completed tasks
        const completedTasks = tasks.filter(t => t.completed);
        if (completedTasks.length > 0) {
            tasksLog.push({
                timestamp: Date.now(),
                tasks: completedTasks
            });
        }

        // Remove completed tasks
        tasks = tasks.filter(t => !t.completed);

        // Clear review input
        if (elements.reviewInput) {
            elements.reviewInput.value = '';
        }

        // Update last reset time
        lastResetTime = Date.now();

        // Save data
        saveData();
        updateUI();

        // Show success notification
        App.showNotification(Translations.getTranslation('notifications.new_week_started'), 'success');
    }

    // Count tasks by quadrant
    function countTasksByQuadrant() {
        const counts = [0, 0, 0, 0];
        tasks.forEach(task => {
            const quadrant = parseInt(task.quadrant) - 1;
            if (quadrant >= 0 && quadrant < 4) {
                counts[quadrant]++;
            }
        });
        return counts;
    }

    // Count completed and pending tasks
    function countCompletedPending() {
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        return [completed, pending];
    }

    // Prepare historical data
    function prepareHistoricalData() {
        const labels = metrics.map(m => new Date(m.timestamp).toLocaleDateString());
        const completionPercentages = metrics.map(m => 
            m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0
        );
        
        // Safely get quadrant counts with fallback to zeros
        const getQuadrantCounts = (m) => {
            if (!m.quadrants || !Array.isArray(m.quadrants)) {
                return [0, 0, 0, 0];
            }
            return [
                m.quadrants[0] || 0,
                m.quadrants[1] || 0,
                m.quadrants[2] || 0,
                m.quadrants[3] || 0
            ];
        };

        const q1Counts = metrics.map(m => getQuadrantCounts(m)[0]);
        const q2Counts = metrics.map(m => getQuadrantCounts(m)[1]);
        const q3Counts = metrics.map(m => getQuadrantCounts(m)[2]);
        const q4Counts = metrics.map(m => getQuadrantCounts(m)[3]);
        const activeRoles = metrics.map(m => m.activeRoles || 0);

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

    // Update metrics
    function updateMetrics() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionPercentage = totalTasks > 0 ? 
            Math.round((completedTasks / totalTasks) * 100) : 0;
        const activeRoles = Roles.getRoles().length;
        const quadrants = countTasksByQuadrant();

        // Update metrics display
        const totalTasksEl = document.getElementById('totalTasks');
        const completionPercentageEl = document.getElementById('completionPercentage');
        const activeRolesEl = document.getElementById('activeRoles');
        const q1CountEl = document.getElementById('q1Count');
        const q2CountEl = document.getElementById('q2Count');
        const q3CountEl = document.getElementById('q3Count');
        const q4CountEl = document.getElementById('q4Count');

        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        if (completionPercentageEl) completionPercentageEl.textContent = completionPercentage + '%';
        if (activeRolesEl) activeRolesEl.textContent = activeRoles;
        if (q1CountEl) q1CountEl.textContent = quadrants[0];
        if (q2CountEl) q2CountEl.textContent = quadrants[1];
        if (q3CountEl) q3CountEl.textContent = quadrants[2];
        if (q4CountEl) q4CountEl.textContent = quadrants[3];
    }

    // Update charts
    function updateCharts() {
        if (!chartQuadrants || !chartCompletion) {
            // If charts don't exist, reinitialize them
            destroyCharts();
            initCharts();
            return;
        }

        if (chartQuadrants) {
            chartQuadrants.data.datasets[0].data = countTasksByQuadrant();
            chartQuadrants.update('none'); // Use 'none' mode for better performance
        }

        if (chartCompletion) {
            chartCompletion.data.datasets[0].data = countCompletedPending();
            chartCompletion.update('none'); // Use 'none' mode for better performance
        }
    }

    // Update historical charts
    function updateHistoricalCharts() {
        if (!chartHistoricalCompletion || !chartHistoricalQuadrants || !chartHistoricalRoles) {
            // If charts don't exist, reinitialize them
            destroyCharts();
            initCharts();
            return;
        }

        const historicalData = prepareHistoricalData();

        if (chartHistoricalCompletion) {
            chartHistoricalCompletion.data.labels = historicalData.labels;
            chartHistoricalCompletion.data.datasets[0].data = historicalData.completionPercentages;
            chartHistoricalCompletion.update('none'); // Use 'none' mode for better performance
        }

        if (chartHistoricalQuadrants) {
            chartHistoricalQuadrants.data.labels = historicalData.labels;
            chartHistoricalQuadrants.data.datasets[0].data = historicalData.q1Counts;
            chartHistoricalQuadrants.data.datasets[1].data = historicalData.q2Counts;
            chartHistoricalQuadrants.data.datasets[2].data = historicalData.q3Counts;
            chartHistoricalQuadrants.data.datasets[3].data = historicalData.q4Counts;
            chartHistoricalQuadrants.update('none'); // Use 'none' mode for better performance
        }

        if (chartHistoricalRoles) {
            chartHistoricalRoles.data.labels = historicalData.labels;
            chartHistoricalRoles.data.datasets[0].data = historicalData.activeRoles;
            chartHistoricalRoles.update('none'); // Use 'none' mode for better performance
        }
    }

    // Export metrics to CSV
    function exportMetrics() {
        const headers = ['Week', 'Total Tasks', 'Completed Tasks', 'Completion %', 'Active Roles', 'Q1', 'Q2', 'Q3', 'Q4'];
        const rows = metrics.map(m => [
            new Date(m.timestamp).toLocaleDateString(),
            m.totalTasks,
            m.completedTasks,
            m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0,
            m.activeRoles,
            m.quadrants[0],
            m.quadrants[1],
            m.quadrants[2],
            m.quadrants[3]
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        downloadCSV(csv, 'habitus-metrics.csv');
    }

    // Export tasks to CSV
    function exportTasks() {
        const headers = ['Week', 'Task', 'Role', 'Quadrant', 'Status', 'Created At'];
        const rows = tasksLog.flatMap(log => 
            log.tasks.map(task => [
                new Date(log.timestamp).toLocaleDateString(),
                task.description,
                task.role,
                task.quadrant,
                task.completed ? 'Completed' : 'Pending',
                new Date(task.createdAt).toLocaleString()
            ])
        );

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        downloadCSV(csv, 'habitus-tasks.csv');
    }

    // Download CSV file
    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Public API
    return {
        init,
        addTask,
        toggleTaskComplete,
        deleteTask,
        saveReview,
        startNewWeek,
        updateCharts,
        exportMetrics,
        exportTasks,
        showRoles,
        showQuadrants,
        destroyCharts,
        getTask,
        saveData,
        updateUI,
        initDragAndDrop
    };
})();

// Make Tasks available globally
window.Tasks = Tasks;

// Remove any automatic initialization
// The initialization will be handled by the main initApp function 

function renderTask(task, index) {
    const quadrantColors = {
        '1': 'bg-red-100 border-red-200',
        '2': 'bg-green-100 border-green-200',
        '3': 'bg-yellow-100 border-yellow-200',
        '4': 'bg-gray-100 border-gray-200'
    };

    const colorClass = quadrantColors[task.quadrant] || 'bg-white border-gray-200';
    
    return `
        <div class="task-item ${colorClass} border rounded shadow-sm flex items-center" 
             data-task-id="${task.id}" 
             data-role="${task.role}" 
             data-quadrant="${task.quadrant}">
            <div class="drag-handle">⋮⋮</div>
            <div class="task-content flex-1 flex items-center">
                <input type="checkbox" 
                       class="mr-2" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="Tasks.toggleTaskComplete('${task.id}')">
                <span class="flex-1 ${task.completed ? 'line-through text-gray-500' : ''}">${task.description}</span>
                <button class="text-red-500 hover:text-red-700 ml-2" 
                        onclick="Tasks.deleteTask('${task.id}')">×</button>
            </div>
        </div>
    `;
}

function findDropTarget(x, y) {
    const elements = document.elementsFromPoint(x, y);
    return elements.find(el => el.classList.contains('task-list'));
}

function updateDropTarget(target) {
    document.querySelectorAll('.task-list').forEach(el => {
        el.classList.remove('drag-over');
    });
    if (target) {
        target.classList.add('drag-over');
    }
}

function handleDrop(taskElement, dropTarget) {
    const taskId = taskElement.dataset.taskId;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetId = dropTarget.id;
    if (targetId.startsWith('role-')) {
        task.role = targetId.replace('role-', '');
    } else if (targetId.startsWith('quadrant-')) {
        task.quadrant = targetId.replace('quadrant-', '');
    }

    saveData();
    updateUI();
}

function getTask(taskId) {
    return tasks.find(t => t.id === taskId);
} 