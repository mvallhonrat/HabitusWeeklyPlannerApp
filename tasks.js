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

    // Initialize tasks module
    function init() {
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
        setupDragAndDrop();
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
                <div class="space-y-2 min-h-[50px] p-2 rounded transition-colors" id="role-${role}">
                    ${roleTasks.length === 0 ? 
                        `<p class="text-sm text-gray-500">${Translations.getTranslation('no_tasks')}</p>` :
                        roleTasks.map(task => createTaskElement(task)).join('')
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
                <div class="space-y-2 min-h-[50px] p-2 rounded transition-colors" id="quadrant-${quadrant}">
                    ${quadrantTasks.length === 0 ? 
                        `<p class="text-sm text-gray-500">${Translations.getTranslation('no_tasks')}</p>` :
                        quadrantTasks.map(task => createTaskElement(task)).join('')
                    }
                </div>
            `;
            elements.quadrantsView.appendChild(quadrantSection);
        }
    }

    // Create task element
    function createTaskElement(task) {
        const quadrantColors = {
            '1': 'bg-red-50 border-red-200',
            '2': 'bg-green-50 border-green-200',
            '3': 'bg-yellow-50 border-yellow-200',
            '4': 'bg-gray-50 border-gray-200'
        };

        const quadrantTextColors = {
            '1': 'text-red-700',
            '2': 'text-green-700',
            '3': 'text-yellow-700',
            '4': 'text-gray-700'
        };

        const quadrantBorderColors = {
            '1': 'border-l-4 border-red-500',
            '2': 'border-l-4 border-green-500',
            '3': 'border-l-4 border-yellow-500',
            '4': 'border-l-4 border-gray-500'
        };

        const quadrantLabels = {
            '1': 'QI',
            '2': 'QII',
            '3': 'QIII',
            '4': 'QIV'
        };

        return `
            <div class="task-item flex items-center justify-between ${quadrantColors[task.quadrant]} ${quadrantBorderColors[task.quadrant]} p-3 rounded shadow-sm mb-2" 
                 draggable="true" 
                 data-task-id="${task.id}"
                 data-role="${task.role}"
                 data-quadrant="${task.quadrant}">
                <div class="flex items-center space-x-3 flex-1">
                    <span class="drag-handle cursor-move text-gray-400 hover:text-gray-600">⋮⋮</span>
                    <input type="checkbox" 
                           class="form-checkbox h-4 w-4 text-indigo-600" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="Tasks.toggleTaskComplete('${task.id}')">
                    <span class="text-sm ${task.completed ? 'line-through text-gray-500' : quadrantTextColors[task.quadrant]}">${task.description}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full ${quadrantColors[task.quadrant]} ${quadrantTextColors[task.quadrant]}">${quadrantLabels[task.quadrant]}</span>
                    <button onclick="Tasks.deleteTask('${task.id}')" class="text-red-500 hover:text-red-700">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    // Set up drag and drop
    function setupDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        const dropZones = document.querySelectorAll('#rolesView > div > div, #quadrantsView > div > div');

        taskItems.forEach(item => {
            // Mouse events
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);

            // Touch events
            item.addEventListener('touchstart', handleTouchStart, { passive: false });
            item.addEventListener('touchmove', handleTouchMove, { passive: false });
            item.addEventListener('touchend', handleTouchEnd);
            item.addEventListener('touchcancel', handleTouchEnd);
        });

        dropZones.forEach(zone => {
            // Mouse events
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);

            // Touch events
            zone.addEventListener('touchmove', handleTouchMove, { passive: false });
            zone.addEventListener('touchend', handleTouchEnd);
            zone.addEventListener('touchcancel', handleTouchEnd);
        });
    }

    // Touch event handlers
    let touchStartY = 0;
    let touchStartX = 0;
    let draggedItem = null;
    let initialTouch = null;

    function handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const item = e.target.closest('.task-item');
        if (!item) return;

        // Prevent default to avoid scrolling
        e.preventDefault();
        
        // Store initial touch position and dragged item
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
        draggedItem = item;
        initialTouch = touch;

        // Add dragging class
        draggedItem.classList.add('opacity-50', 'dragging');
        
        // Create a ghost element for visual feedback
        const ghost = draggedItem.cloneNode(true);
        ghost.classList.add('touch-ghost');
        ghost.style.position = 'fixed';
        ghost.style.zIndex = '1000';
        ghost.style.width = draggedItem.offsetWidth + 'px';
        ghost.style.pointerEvents = 'none';
        ghost.style.transform = 'scale(0.95)';
        ghost.style.opacity = '0.8';
        document.body.appendChild(ghost);
        
        // Update ghost position
        updateGhostPosition(touch.clientX, touch.clientY, ghost);
    }

    function handleTouchMove(e) {
        if (!draggedItem || !initialTouch) return;
        
        const touch = e.touches[0];
        e.preventDefault(); // Prevent scrolling

        // Find ghost element
        const ghost = document.querySelector('.touch-ghost');
        if (ghost) {
            updateGhostPosition(touch.clientX, touch.clientY, ghost);
        }

        // Find drop target
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = dropTarget?.closest('[id^="role-"], [id^="quadrant-"]');
        
        // Remove drag-over class from all drop zones
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over', 'bg-gray-100');
        });

        // Add drag-over class to current drop zone
        if (dropZone) {
            dropZone.classList.add('drag-over', 'bg-gray-100');
        }
    }

    function handleTouchEnd(e) {
        if (!draggedItem) return;

        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropZone = dropTarget?.closest('[id^="role-"], [id^="quadrant-"]');

        // Remove ghost element
        const ghost = document.querySelector('.touch-ghost');
        if (ghost) {
            document.body.removeChild(ghost);
        }

        // Remove dragging class
        draggedItem.classList.remove('opacity-50', 'dragging');

        // Remove drag-over class from all drop zones
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over', 'bg-gray-100');
        });

        // Handle drop
        if (dropZone && draggedItem) {
            const taskId = draggedItem.dataset.taskId;
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                // Update task based on drop zone
                if (dropZone.id.startsWith('role-')) {
                    const newRole = dropZone.id.replace('role-', '');
                    task.role = newRole;
                } else if (dropZone.id.startsWith('quadrant-')) {
                    const newQuadrant = dropZone.id.replace('quadrant-', '');
                    task.quadrant = newQuadrant;
                }
                
                saveData();
                updateUI();
            }
        }

        // Reset touch state
        draggedItem = null;
        initialTouch = null;
    }

    function updateGhostPosition(x, y, ghost) {
        if (!ghost) return;
        
        // Calculate position relative to viewport
        const rect = ghost.getBoundingClientRect();
        const offsetX = x - touchStartX;
        const offsetY = y - touchStartY;
        
        // Update ghost position
        ghost.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.95)`;
    }

    // Handle drag start
    function handleDragStart(e) {
        e.target.classList.add('opacity-50', 'dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
    }

    // Handle drag end
    function handleDragEnd(e) {
        e.target.classList.remove('opacity-50', 'dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    // Handle drag over
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dropZone = e.target.closest('[id^="role-"], [id^="quadrant-"]');
        if (dropZone) {
            dropZone.classList.add('drag-over', 'bg-gray-100');
        }
    }

    // Handle drag leave
    function handleDragLeave(e) {
        const dropZone = e.target.closest('[id^="role-"], [id^="quadrant-"]');
        if (dropZone) {
            dropZone.classList.remove('drag-over', 'bg-gray-100');
        }
    }

    // Handle drop
    function handleDrop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const dropZone = e.target.closest('[id^="role-"], [id^="quadrant-"]');
        
        if (dropZone && taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                // Update task based on drop zone
                if (dropZone.id.startsWith('role-')) {
                    const newRole = dropZone.id.replace('role-', '');
                    task.role = newRole;
                } else if (dropZone.id.startsWith('quadrant-')) {
                    const newQuadrant = dropZone.id.replace('quadrant-', '');
                    task.quadrant = newQuadrant;
                }
                
                saveData();
                updateUI();
            }
        }
        
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'bg-gray-100'));
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
        if (chartQuadrants) {
            chartQuadrants.data.datasets[0].data = countTasksByQuadrant();
            chartQuadrants.update();
        }

        if (chartCompletion) {
            chartCompletion.data.datasets[0].data = countCompletedPending();
            chartCompletion.update();
        }
    }

    // Update historical charts
    function updateHistoricalCharts() {
        const historicalData = prepareHistoricalData();

        if (chartHistoricalCompletion) {
            chartHistoricalCompletion.data.labels = historicalData.labels;
            chartHistoricalCompletion.data.datasets[0].data = historicalData.completionPercentages;
            chartHistoricalCompletion.update();
        }

        if (chartHistoricalQuadrants) {
            chartHistoricalQuadrants.data.labels = historicalData.labels;
            chartHistoricalQuadrants.data.datasets[0].data = historicalData.q1Counts;
            chartHistoricalQuadrants.data.datasets[1].data = historicalData.q2Counts;
            chartHistoricalQuadrants.data.datasets[2].data = historicalData.q3Counts;
            chartHistoricalQuadrants.data.datasets[3].data = historicalData.q4Counts;
            chartHistoricalQuadrants.update();
        }

        if (chartHistoricalRoles) {
            chartHistoricalRoles.data.labels = historicalData.labels;
            chartHistoricalRoles.data.datasets[0].data = historicalData.activeRoles;
            chartHistoricalRoles.update();
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
        exportMetrics,
        exportTasks,
        showRoles,
        showQuadrants
    };
})();

// Initialize tasks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Tasks.init();
}); 