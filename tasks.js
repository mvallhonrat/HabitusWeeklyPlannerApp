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
    let autoScrollInterval = null;
    const SCROLL_THRESHOLD = 60; // pixels from top/bottom to trigger scroll
    const SCROLL_SPEED = 10; // pixels per scroll interval
    const SCROLL_INTERVAL = 16; // ms between scrolls (roughly 60fps)

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
        
        // Migrate metrics data if needed
        migrateMetricsData();

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

    // Update the migrateMetricsData function to be more robust
    function migrateMetricsData() {
        if (!metrics || !Array.isArray(metrics)) return;
        
        console.log('Original metrics before migration:', metrics);
        
        let needsMigration = false;
        const migratedMetrics = metrics.map(metric => {
            // Check if this is old format data (from version 1.0.0)
            const isOldFormat = metric.hasOwnProperty('porcentaje') || 
                              metric.hasOwnProperty('q1') || 
                              metric.hasOwnProperty('fecha');

            if (isOldFormat) {
                needsMigration = true;
                console.log('Found old format metric:', metric);
                
                // Convert old format to new format
                const newMetric = {
                    timestamp: metric.fecha ? new Date(metric.fecha).getTime() : Date.now(),
                    totalTasks: (metric.completadas || 0) + (metric.pendientes || 0),
                    completedTasks: metric.completadas || 0,
                    activeRoles: metric.roles || 0,
                    quadrants: [
                        parseInt(metric.q1) || 0,
                        parseInt(metric.q2) || 0,
                        parseInt(metric.q3) || 0,
                        parseInt(metric.q4) || 0
                    ],
                    review: metric.revision || ''
                };
                console.log('Converted to new format:', newMetric);
                return newMetric;
            }

            // Handle timestamp conversion for already migrated data
            let newTimestamp;
            if (metric.timestamp instanceof Date) {
                needsMigration = true;
                newTimestamp = metric.timestamp.getTime();
            } else if (typeof metric.timestamp === 'string') {
                needsMigration = true;
                const parsedDate = new Date(metric.timestamp);
                newTimestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
            } else if (typeof metric.timestamp === 'number') {
                needsMigration = true;
                newTimestamp = metric.timestamp < 1000000000000 ? metric.timestamp * 1000 : metric.timestamp;
            } else {
                // Keep existing data if it's already in new format
                return metric;
            }

            return {
                ...metric,
                timestamp: newTimestamp
            };
        });

        if (needsMigration) {
            console.log('Migrated metrics:', migratedMetrics);
            metrics = migratedMetrics;
            saveData();
            App.showNotification(Translations.getTranslation('notifications.data_migrated'), 'success');
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
            let originalScrollY = 0;
            let scrollLockHandler = null;
            let lastTouchY = 0;

            function startAutoScroll() {
                if (autoScrollInterval) return;
                
                autoScrollInterval = setInterval(() => {
                    if (!ghostElement) return;
                    
                    const ghostRect = ghostElement.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const scrollAmount = window.scrollY;
                    
                    // Calculate distance from top and bottom of viewport
                    const distanceFromTop = ghostRect.top;
                    const distanceFromBottom = viewportHeight - ghostRect.bottom;
                    
                    // Determine scroll direction and speed
                    let scrollDelta = 0;
                    if (distanceFromTop < SCROLL_THRESHOLD) {
                        // Scroll up
                        scrollDelta = -SCROLL_SPEED * (1 - distanceFromTop / SCROLL_THRESHOLD);
                    } else if (distanceFromBottom < SCROLL_THRESHOLD) {
                        // Scroll down
                        scrollDelta = SCROLL_SPEED * (1 - distanceFromBottom / SCROLL_THRESHOLD);
                    }
                    
                    if (scrollDelta !== 0) {
                        window.scrollBy(0, scrollDelta);
                        // Update ghost position to account for scroll
                        if (ghostElement) {
                            const currentTop = parseInt(ghostElement.style.top);
                            ghostElement.style.top = `${currentTop + scrollDelta}px`;
                        }
                    }
                }, SCROLL_INTERVAL);
            }

            function stopAutoScroll() {
                if (autoScrollInterval) {
                    clearInterval(autoScrollInterval);
                    autoScrollInterval = null;
                }
            }

            function handleDragMove(e, touch = false) {
                if (!isDragging) return;
                e.preventDefault();
                
                const clientY = touch ? e.touches[0].clientY : e.clientY;
                const clientX = touch ? e.touches[0].clientX : e.clientX;
                const deltaY = clientY - startY;
                lastTouchY = clientY;
                
                // Update ghost position
                if (ghostElement) {
                    const newTop = parseInt(ghostElement.style.top) + deltaY;
                    ghostElement.style.top = `${newTop}px`;
                    
                    // Check if we need to start auto-scrolling
                    const ghostRect = ghostElement.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    
                    if (ghostRect.top < SCROLL_THRESHOLD || 
                        (viewportHeight - ghostRect.bottom) < SCROLL_THRESHOLD) {
                        startAutoScroll();
                    } else {
                        stopAutoScroll();
                    }
                }
                startY = clientY;
                
                // Find and update drop target
                const dropTarget = findDropTarget(clientX, clientY);
                document.querySelectorAll('.task-list').forEach(el => {
                    el.classList.remove('drag-over');
                });
                if (dropTarget) {
                    dropTarget.classList.add('drag-over');
                }
            }

            function cleanupDrag() {
                if (!isDragging) return;
                
                // Stop auto-scrolling
                stopAutoScroll();
                
                // Remove scroll prevention
                if (scrollLockHandler) {
                    window.removeEventListener('scroll', scrollLockHandler);
                    scrollLockHandler = null;
                }
                
                // Restore body scroll
                document.body.classList.remove('dragging');
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.height = '';
                
                // Restore original element
                if (taskElement) {
                    taskElement.style.visibility = '';
                    taskElement.classList.remove('dragging');
                }
                
                // Cleanup ghost element
                if (ghostElement && ghostElement.parentNode) {
                    ghostElement.parentNode.removeChild(ghostElement);
                    ghostElement = null;
                }
                
                // Cleanup drop targets
                document.querySelectorAll('.task-list').forEach(el => {
                    el.classList.remove('drag-over');
                });
                
                isDragging = false;
            }

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

            function startDrag(e, touch = false) {
                if (e.target !== handle) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const clientY = touch ? e.touches[0].clientY : e.clientY;
                const clientX = touch ? e.touches[0].clientX : e.clientX;
                const rect = taskElement.getBoundingClientRect();
                
                startY = clientY;
                startX = clientX;
                originalScrollY = window.scrollY;
                
                // Create ghost
                ghostElement = taskElement.cloneNode(true);
                ghostElement.classList.add('task-ghost');
                ghostElement.style.position = 'fixed';
                ghostElement.style.width = `${rect.width}px`;
                ghostElement.style.height = `${rect.height}px`;
                ghostElement.style.left = `${rect.left}px`;
                ghostElement.style.top = `${rect.top}px`;
                ghostElement.style.zIndex = '1000';
                ghostElement.style.opacity = '0.8';
                ghostElement.style.pointerEvents = 'none';
                ghostElement.style.transform = 'translateZ(0)';
                document.body.appendChild(ghostElement);
                
                // Hide original element
                taskElement.style.visibility = 'hidden';
                
                // Prevent scrolling
                scrollLockHandler = () => {
                    window.scrollTo(0, originalScrollY);
                };
                
                // Lock body scroll
                document.body.classList.add('dragging');
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'relative';
                document.body.style.height = '100%';
                
                // Add scroll prevention
                window.addEventListener('scroll', scrollLockHandler, { passive: false });
                
                isDragging = true;
                taskElement.classList.add('dragging');

                return { clientY, clientX };
            }

            function endDrag(e, touch = false) {
                if (!isDragging) return;
                e.preventDefault();
                
                const clientX = touch ? e.changedTouches[0].clientX : e.clientX;
                const clientY = touch ? e.changedTouches[0].clientY : e.clientY;
                const dropTarget = findDropTarget(clientX, clientY);
                
                // Handle drop first
                handleDrop(dropTarget);
                
                // Then cleanup immediately
                cleanupDrag();
            }

            // Touch events
            handle.addEventListener('touchstart', function(e) {
                const coords = startDrag(e, true);
                if (!coords) return;

                function onTouchMove(e) {
                    handleDragMove(e, true);
                }

                function onTouchEnd(e) {
                    endDrag(e, true);
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                    document.removeEventListener('touchcancel', onTouchCancel);
                }

                function onTouchCancel(e) {
                    cleanupDrag();
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                    document.removeEventListener('touchcancel', onTouchCancel);
                }

                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
                document.addEventListener('touchcancel', onTouchCancel);
            }, { passive: false });

            // Mouse events
            handle.addEventListener('mousedown', function(e) {
                const coords = startDrag(e);
                if (!coords) return;

                function onMouseMove(e) {
                    handleDragMove(e);
                }

                function onMouseUp(e) {
                    endDrag(e);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.removeEventListener('mouseleave', onMouseLeave);
                }

                function onMouseLeave(e) {
                    cleanupDrag();
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.removeEventListener('mouseleave', onMouseLeave);
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('mouseleave', onMouseLeave);
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

    // Update the prepareHistoricalData function
    function prepareHistoricalData() {
        // Ensure metrics are migrated
        migrateMetricsData();
        
        console.log('Preparing historical data with metrics:', metrics);
        
        const labels = metrics.map(m => {
            try {
                const timestamp = typeof m.timestamp === 'string' ? 
                    parseInt(m.timestamp) : 
                    m.timestamp;
                
                if (isNaN(timestamp)) {
                    console.error('Invalid timestamp:', m.timestamp);
                    return 'Invalid Date';
                }
                
                const date = new Date(timestamp);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date from timestamp:', timestamp);
                    return 'Invalid Date';
                }
                
                return date.toLocaleDateString();
            } catch (error) {
                console.error('Error processing date:', error);
                return 'Invalid Date';
            }
        });
        
        console.log('Generated labels:', labels);
        
        // Handle both old and new format for completion percentages
        const completionPercentages = metrics.map(m => {
            if (m.hasOwnProperty('porcentaje')) {
                // Old format
                return parseInt(m.porcentaje.replace('%', '')) || 0;
            } else {
                // New format
                return m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0;
            }
        });
        
        // Safely get quadrant counts with fallback to zeros
        const getQuadrantCounts = (m) => {
            if (m.hasOwnProperty('q1')) {
                // Old format
                return [
                    parseInt(m.q1) || 0,
                    parseInt(m.q2) || 0,
                    parseInt(m.q3) || 0,
                    parseInt(m.q4) || 0
                ];
            } else if (m.quadrants && Array.isArray(m.quadrants)) {
                // New format
                return [
                    m.quadrants[0] || 0,
                    m.quadrants[1] || 0,
                    m.quadrants[2] || 0,
                    m.quadrants[3] || 0
                ];
            }
            return [0, 0, 0, 0];
        };

        const q1Counts = metrics.map(m => getQuadrantCounts(m)[0]);
        const q2Counts = metrics.map(m => getQuadrantCounts(m)[1]);
        const q3Counts = metrics.map(m => getQuadrantCounts(m)[2]);
        const q4Counts = metrics.map(m => getQuadrantCounts(m)[3]);
        
        // Handle both old and new format for active roles
        const activeRoles = metrics.map(m => m.hasOwnProperty('roles') ? m.roles : (m.activeRoles || 0));

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

    // Add a function to manually trigger migration and debug
    function debugMetricsData() {
        console.log('Current metrics data:', metrics);
        console.log('Metrics data type:', typeof metrics);
        console.log('Is array:', Array.isArray(metrics));
        if (Array.isArray(metrics)) {
            metrics.forEach((m, i) => {
                console.log(`Metric ${i}:`, m);
                console.log(`Timestamp ${i}:`, m.timestamp);
                console.log(`Timestamp type ${i}:`, typeof m.timestamp);
            });
        }
        migrateMetricsData();
        console.log('Migrated metrics data:', metrics);
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
        initDragAndDrop,
        migrateMetricsData,
        debugMetricsData  // Add debug function to public API
    };
})();

// Make Tasks available globally
window.Tasks = Tasks;

// Remove any automatic initialization
// The initialization will be handled by the main initApp function 

function renderTask(task, index) {
    const quadrantClass = `q${task.quadrant}`;
    
    return `
        <div class="task-item ${quadrantClass} border rounded shadow-sm" 
             data-task-id="${task.id}" 
             data-role="${task.role}" 
             data-quadrant="${task.quadrant}">
            <div class="drag-handle">⋮⋮</div>
            <div class="task-content">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="Tasks.toggleTaskComplete('${task.id}')">
                <span class="${task.completed ? 'line-through text-gray-500' : ''}">${task.description}</span>
                <button onclick="Tasks.deleteTask('${task.id}')">×</button>
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