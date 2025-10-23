// State management
class StateManager {
    constructor(initialState) {
        this.state = initialState;
        this.listeners = [];
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(listener => listener(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    getState() {
        return this.state;
    }
}

class PomodoroTimer {
    constructor() {
        // Initial state
        this.stateManager = new StateManager({
            showDashboard: false,
            showSettings: false,
            editingTaskId: null,

            // Timer state
            timeLeft: 25 * 60,
            isRunning: false,
            isBreak: false,
            sessionType: 'work',
            currentTaskId: '',
            sessionCount: 0,

            // Settings state
            settings: {
                workDuration: 25,
                breakDuration: 5,
                longBreakDuration: 15,
                longBreakInterval: 4,
                notifications: true,
                autoStartBreaks: false,
                autoStartPomodoros: false
            },

            // Task state
            tasks: [],
            sessionHistory: []
        });

        this.timerInterval = null;
        this.notificationPermissionRequested = false;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.stateManager.subscribe((state) => this.updateUI(state));
        this.updateUI(this.stateManager.getState());
        this.setupPageLeaveWarning();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    loadFromLocalStorage() {
        const savedState = localStorage.getItem('pomodoroState');
        const savedSettings = localStorage.getItem('pomodoroSettings');
        const savedSessionCount = localStorage.getItem('pomodoroSessionCount');

        if (savedState) {
            const parsedState = JSON.parse(savedState);
            this.stateManager.setState({
                tasks: parsedState.tasks || [],
                sessionHistory: parsedState.sessionHistory || []
            });
        }
        if (savedSettings) {
            const loadedSettings = JSON.parse(savedSettings);
            this.stateManager.setState({
                settings: loadedSettings
            });

            // Update timer display with loaded settings
            const state = this.stateManager.getState();
            let duration = loadedSettings.workDuration * 60;
            if (state.sessionType === 'short-break') {
                duration = loadedSettings.breakDuration * 60;
            } else if (state.sessionType === 'long-break') {
                duration = loadedSettings.longBreakDuration * 60;
            }

            this.stateManager.setState({
                timeLeft: duration
            });
        }
        if (savedSessionCount) {
            this.stateManager.setState({
                sessionCount: parseInt(savedSessionCount) || 0
            });
        }
    }

    saveToLocalStorage() {
        const state = this.stateManager.getState();
        localStorage.setItem('pomodoroState', JSON.stringify({
            tasks: state.tasks,
            sessionHistory: state.sessionHistory
        }));
        localStorage.setItem('pomodoroSettings', JSON.stringify(state.settings));
        localStorage.setItem('pomodoroSessionCount', state.sessionCount.toString());
    }

    showNotification(message) {
        const state = this.stateManager.getState();
        console.log('Notification attempt:', message);

        if (!state.settings.notifications) {
            console.log('Notifications disabled in settings');
            return;
        }

        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            console.log('Permission granted, showing notification');
            new Notification('Pomodoro Timer', {
                body: message,
                icon: '/favicon.ico'
            });
        } else {
            console.log('Notification permission not granted:', Notification.permission);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            console.log('Requesting notification permission');
            try {
                const permission = await Notification.requestPermission();
                console.log('Notification permission result:', permission);
                this.notificationPermissionRequested = true;
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }
    }

    handleTimerComplete() {
        console.log('=== handleTimerComplete CALLED ===');
        const state = this.stateManager.getState();
        console.log('Timer completed - isBreak:', state.isBreak, 'sessionType:', state.sessionType);

        // Clear timer interval first
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (state.isBreak) {
            // Break completed - switch to work
            console.log('Break completed, switching to work session');
            this.showNotification('Break finished! Ready for another work session?');

            const newState = {
                isRunning: false,
                isBreak: false,
                sessionType: 'work',
                timeLeft: state.settings.workDuration * 60
            };

            console.log('Setting new state after break:', newState);
            this.stateManager.setState(newState);

            // Auto-start next pomodoro if enabled
            if (state.settings.autoStartPomodoros) {
                setTimeout(() => {
                    this.stateManager.setState({ isRunning: true });
                }, 1000);
            }
        } else {
            // Work session completed - switch to break
            console.log('Work session completed, switching to break');
            const newSessionCount = state.sessionCount + 1; // Only increment here
            const isLongBreak = newSessionCount % state.settings.longBreakInterval === 0;
            const breakDuration = isLongBreak ? state.settings.longBreakDuration : state.settings.breakDuration;
            const breakType = isLongBreak ? 'long-break' : 'short-break';

            // Record session history
            const currentTask = state.tasks.find(t => t.id === state.currentTaskId);
            const taskName = currentTask ? currentTask.name : 'No task selected';

            const newSession = {
                id: Date.now().toString(),
                taskId: state.currentTaskId,
                taskName: taskName,
                duration: state.settings.workDuration,
                date: new Date().toISOString(),
                type: 'work'
            };

            // Update task stats if task exists
            let updatedTasks = state.tasks;
            if (currentTask) {
                updatedTasks = state.tasks.map(task =>
                    task.id === state.currentTaskId
                        ? {
                            ...task,
                            pomodoros: (task.pomodoros || 0) + 1,
                            totalMinutes: (task.totalMinutes || 0) + state.settings.workDuration,
                            lastUsed: new Date().toISOString()
                        }
                        : task
                );
            }

            // Show notification
            this.showNotification(`Work session completed! Time for a ${isLongBreak ? 'long ' : ''}break.`);

            // Update state - this will trigger UI updates
            this.stateManager.setState({
                isRunning: false,
                isBreak: true,
                sessionType: breakType,
                sessionCount: newSessionCount,
                timeLeft: breakDuration * 60,
                tasks: updatedTasks,
                sessionHistory: [newSession, ...state.sessionHistory]
            });

            // Auto-start break if enabled
            if (state.settings.autoStartBreaks) {
                setTimeout(() => {
                    this.stateManager.setState({ isRunning: true });
                }, 1000);
            }
        }

        this.saveToLocalStorage();
    }

    async toggleTimer() {
        const state = this.stateManager.getState();

        if (!state.isRunning) {
            console.log('Starting timer, checking notification permission...');

            // Always check and request notification permission when starting timer
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    console.log('Requesting notification permission...');
                    try {
                        const permission = await Notification.requestPermission();
                        console.log('Notification permission:', permission);
                    } catch (error) {
                        console.error('Error requesting notification permission:', error);
                    }
                }

                // Show notification if permission is granted and enabled in settings
                if (Notification.permission === 'granted' && state.settings.notifications) {
                    if (!state.isBreak) {
                        this.showNotification('Work session started! Stay focused!');
                    } else {
                        this.showNotification('Break started! Relax and recharge.');
                    }
                }
            }

            this.stateManager.setState({ isRunning: true });
        } else {
            console.log('Pausing timer');
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.stateManager.setState({ isRunning: false });
        }
    }

    resetTimer() {
        const state = this.stateManager.getState();

        // Clear timer interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        let duration = state.settings.workDuration * 60;
        if (state.sessionType === 'short-break') {
            duration = state.settings.breakDuration * 60;
        } else if (state.sessionType === 'long-break') {
            duration = state.settings.longBreakDuration * 60;
        }

        this.stateManager.setState({
            isRunning: false,
            timeLeft: duration
        });
    }

    switchSessionType(type) {
        const state = this.stateManager.getState();
        if (state.isRunning) return;

        let duration = state.settings.workDuration * 60;
        let isBreak = false;

        if (type === 'short-break') {
            duration = state.settings.breakDuration * 60;
            isBreak = true;
        } else if (type === 'long-break') {
            duration = state.settings.longBreakDuration * 60;
            isBreak = true;
        }

        this.stateManager.setState({
            sessionType: type,
            timeLeft: duration,
            isBreak
        });
    }

    addTask(name, description) {
        if (name.trim()) {
            const state = this.stateManager.getState();
            const newTask = {
                id: Date.now().toString(),
                name: name.trim(),
                description: description.trim(),
                pomodoros: 0,
                totalMinutes: 0,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };

            this.stateManager.setState({
                tasks: [...state.tasks, newTask]
            });
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteTask(id) {
        const state = this.stateManager.getState();
        this.stateManager.setState({
            tasks: state.tasks.filter(task => task.id !== id),
            currentTaskId: state.currentTaskId === id ? '' : state.currentTaskId
        });
        this.saveToLocalStorage();
    }

    startEditingTask(task) {
        this.stateManager.setState({
            editingTaskId: task.id
        });
    }

    saveEditedTask(taskId, name, description) {
        if (name.trim()) {
            const state = this.stateManager.getState();
            this.stateManager.setState({
                tasks: state.tasks.map(task =>
                    task.id === taskId
                        ? {
                            ...task,
                            name: name.trim(),
                            description: description.trim(),
                            lastUsed: new Date().toISOString()
                        }
                        : task
                ),
                editingTaskId: null
            });
            this.saveToLocalStorage();
        }
    }

    cancelEditingTask() {
        this.stateManager.setState({
            editingTaskId: null
        });
    }

    updateSettings(newSettings) {
        const state = this.stateManager.getState();
        this.stateManager.setState({ settings: newSettings });

        // Reset timer with new durations if not running
        if (!state.isRunning) {
            let duration = newSettings.workDuration * 60;
            if (state.sessionType === 'short-break') {
                duration = newSettings.breakDuration * 60;
            } else if (state.sessionType === 'long-break') {
                duration = newSettings.longBreakDuration * 60;
            }
            this.stateManager.setState({ timeLeft: duration });
        }

        this.saveToLocalStorage();
    }

    setupPageLeaveWarning() {
        window.addEventListener('beforeunload', (e) => {
            const state = this.stateManager.getState();
            if (state.isRunning) {
                e.preventDefault();
                e.returnValue = 'You have an active timer running. Are you sure you want to leave?';
                return 'You have an active timer running. Are you sure you want to leave?';
            }
        });
    }

    updateUI(state) {
        this.updateTimerDisplay(state);
        this.updateTaskList(state);
        this.updateTaskSelect(state);
        this.updateCurrentTaskInfo(state);
        this.updateModals(state);
        this.updateDashboard(state);
        this.updateSettingsForm(state);
        this.setupTimer(state);
    }

    updateTimerDisplay(state) {
        const timerDisplay = document.getElementById('timer-display');
        const sessionInfo = document.getElementById('session-info');
        const toggleTimerBtn = document.getElementById('toggle-timer');
        const sessionToggleBtns = document.querySelectorAll('.toggle-btn');

        console.log('Updating timer display - timeLeft:', state.timeLeft, 'sessionCount:', state.sessionCount, 'isRunning:', state.isRunning);

        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(state.timeLeft);
            console.log('Timer display updated to:', timerDisplay.textContent);
        }

        if (sessionInfo) {
            sessionInfo.textContent = `Session ${state.sessionCount}`;
            console.log('Session info updated to:', sessionInfo.textContent);
        }

        if (toggleTimerBtn) {
            toggleTimerBtn.textContent = state.isRunning ? 'Pause' : 'Start';
            console.log('Toggle button updated to:', toggleTimerBtn.textContent);
        }

        sessionToggleBtns.forEach(btn => {
            const type = btn.getAttribute('data-type');
            if (type === state.sessionType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateTaskList(state) {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        if (state.tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Add your first task above!</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = state.tasks.map(task => {
            if (state.editingTaskId === task.id) {
                return `
                    <div class="task-item" data-task-id="${task.id}">
                        <div class="edit-form">
                            <input type="text" value="${this.escapeHtml(task.name)}" class="form-input edit-name" placeholder="Task name">
                            <input type="text" value="${this.escapeHtml(task.description || '')}" class="form-input edit-desc" placeholder="Description (optional)">
                            <div class="edit-actions">
                                <button class="icon-btn save-edit" title="Save">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>
                                </button>
                                <button class="icon-btn cancel-edit" title="Cancel">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-name">${this.escapeHtml(task.name)}</div>
                        <div class="task-actions">
                            <button class="icon-btn edit-btn" title="Edit task">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                            </button>
                            <button class="icon-btn delete-btn" title="Delete task">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="task-stats">
                        <div class="task-meta">
                            <span>${task.pomodoros} pomodoros</span>
                            <span>Created ${this.formatDate(task.createdAt)}</span>
                            <span>${task.totalMinutes} minutes</span>
                        </div>
                        <button class="btn btn-secondary set-active-btn">
                            Set Active
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.attachTaskEventListeners();
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    updateTaskSelect(state) {
        const taskSelect = document.getElementById('current-task-select');
        if (!taskSelect) return;

        const currentValue = taskSelect.value;
        taskSelect.innerHTML = '<option value="">Select a task</option>' +
            state.tasks.map(task => `
                <option value="${task.id}" ${state.currentTaskId === task.id ? 'selected' : ''}>
                    ${this.escapeHtml(task.name)} (${task.pomodoros} pomodoros)
                </option>
            `).join('');

        if (currentValue && state.tasks.some(task => task.id === currentValue)) {
            taskSelect.value = currentValue;
        }
    }

    updateCurrentTaskInfo(state) {
        const currentTaskInfo = document.getElementById('current-task-info');
        const currentTaskName = document.getElementById('current-task-name');
        const currentTaskPomodoros = document.getElementById('current-task-pomodoros');

        const currentTask = state.tasks.find(task => task.id === state.currentTaskId);

        if (currentTask) {
            currentTaskInfo.style.display = 'block';
            currentTaskName.textContent = `Current Task: ${currentTask.name}`;
            currentTaskPomodoros.textContent = `Pomodoros completed: ${currentTask.pomodoros}`;
        } else {
            currentTaskInfo.style.display = 'none';
        }
    }

    updateModals(state) {
        const dashboardModal = document.getElementById('dashboard-modal');
        const settingsModal = document.getElementById('settings-modal');

        if (dashboardModal) {
            dashboardModal.style.display = state.showDashboard ? 'flex' : 'none';
        }
        if (settingsModal) {
            settingsModal.style.display = state.showSettings ? 'flex' : 'none';
        }
    }

    updateDashboard(state) {
        console.log('Updating dashboard with state:', state);

        // Calculate stats
        const totalPomodoros = state.tasks.reduce((sum, task) => sum + (task.pomodoros || 0), 0);

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const todayPomodoros = state.sessionHistory.filter(session => {
            try {
                const sessionDate = new Date(session.date);
                return sessionDate >= todayStart && session.type === 'work';
            } catch {
                return false;
            }
        }).length;

        console.log('Dashboard stats - Total:', totalPomodoros, 'Today:', todayPomodoros, 'Session Count:', state.sessionCount);

        // Update stats
        const totalPomodorosEl = document.getElementById('total-pomodoros');
        const totalTasksEl = document.getElementById('total-tasks');
        const todayPomodorosEl = document.getElementById('today-pomodoros');
        const currentStreakEl = document.getElementById('current-streak');

        if (totalPomodorosEl) totalPomodorosEl.textContent = totalPomodoros;
        if (totalTasksEl) totalTasksEl.textContent = state.tasks.length;
        if (todayPomodorosEl) todayPomodorosEl.textContent = todayPomodoros;
        if (currentStreakEl) currentStreakEl.textContent = state.sessionCount;

        // Update performance list
        const performanceList = document.getElementById('performance-list');
        if (performanceList) {
            if (state.tasks.length === 0) {
                performanceList.innerHTML = `
                <div class="empty-state">
                    <p>No task performance data yet.</p>
                </div>
            `;
            } else {
                performanceList.innerHTML = state.tasks.map(task => {
                    const totalHours = Math.round(((task.totalMinutes || 0) / 60) * 10) / 10;
                    return `
                    <div class="performance-item">
                        <div class="performance-task">${this.escapeHtml(task.name)}</div>
                        <div class="performance-details">
                            ${task.pomodoros || 0} sessions • ${totalHours}h total • Last used ${this.formatDate(task.lastUsed)}
                        </div>
                    </div>
                `;
                }).join('');
            }
        }

        // Update history list - ONLY ONE TIME, NOT DUPLICATED
        const historyList = document.getElementById('history-list');
        if (historyList) {
            const recentSessions = state.sessionHistory.slice(0, 10);

            if (recentSessions.length === 0) {
                historyList.innerHTML = `
                <div class="empty-state">
                    <p>No session history yet. Complete some pomodoros to see your history!</p>
                </div>
            `;
            } else {
                historyList.innerHTML = recentSessions.map(session => {
                    const taskName = session.taskName || 'No task selected';
                    const sessionType = session.type === 'work' ? 'Work Session' :
                        session.type === 'short-break' ? 'Short Break' : 'Long Break';
                    return `
                    <div class="history-item">
                        <div>
                            <div class="history-task">${this.escapeHtml(taskName)}</div>
                            <div class="history-details">
                                ${session.duration} minutes • ${this.formatDateTime(session.date)} • ${sessionType}
                            </div>
                        </div>
                    </div>
                `;
                }).join('');
            }
        }
    }

    updateSettingsForm(state) {
        const settingsForm = document.getElementById('settings-form');
        if (!settingsForm) return;

        const elements = settingsForm.elements;
        elements.workDuration.value = state.settings.workDuration;
        elements.breakDuration.value = state.settings.breakDuration;
        elements.longBreakDuration.value = state.settings.longBreakDuration;
        elements.longBreakInterval.value = state.settings.longBreakInterval;
        elements.notifications.checked = state.settings.notifications;
        elements.autoStartBreaks.checked = state.settings.autoStartBreaks;
        elements.autoStartPomodoros.checked = state.settings.autoStartPomodoros;
    }

    attachTaskEventListeners() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        // Remove existing listeners
        taskList.removeEventListener('click', this.taskListClickHandler);

        this.taskListClickHandler = (e) => {
            const target = e.target;
            const taskItem = target.closest('.task-item');
            if (!taskItem) return;

            const taskId = taskItem.dataset.taskId;
            const state = this.stateManager.getState();
            const task = state.tasks.find(t => t.id === taskId);
            if (!task) return;

            if (target.closest('.edit-btn')) {
                this.startEditingTask(task);
            } else if (target.closest('.delete-btn')) {
                this.deleteTask(taskId);
            } else if (target.closest('.set-active-btn')) {
                this.stateManager.setState({ currentTaskId: taskId });
            } else if (target.closest('.save-edit')) {
                const nameInput = taskItem.querySelector('.edit-name');
                const descInput = taskItem.querySelector('.edit-desc');
                if (nameInput) {
                    this.saveEditedTask(taskId, nameInput.value, descInput?.value || '');
                }
            } else if (target.closest('.cancel-edit')) {
                this.cancelEditingTask();
            }
        };

        taskList.addEventListener('click', this.taskListClickHandler);

        // Handle Enter key in edit inputs
        taskList.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const target = e.target;
                if (target.classList.contains('edit-name') || target.classList.contains('edit-desc')) {
                    e.preventDefault();
                    const taskItem = target.closest('.task-item');
                    const taskId = taskItem.dataset.taskId;
                    const nameInput = taskItem.querySelector('.edit-name');
                    const descInput = taskItem.querySelector('.edit-desc');
                    if (nameInput) {
                        this.saveEditedTask(taskId, nameInput.value, descInput?.value || '');
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // Timer controls
        const toggleTimerBtn = document.getElementById('toggle-timer');
        const resetTimerBtn = document.getElementById('reset-timer');
        const sessionToggleBtns = document.querySelectorAll('.toggle-btn[data-type]');
        const currentTaskSelect = document.getElementById('current-task-select');

        if (toggleTimerBtn) {
            toggleTimerBtn.onclick = () => this.toggleTimer();
        }
        if (resetTimerBtn) {
            resetTimerBtn.onclick = () => this.resetTimer();
        }

        sessionToggleBtns.forEach(btn => {
            btn.onclick = () => this.switchSessionType(btn.dataset.type);
        });

        if (currentTaskSelect) {
            currentTaskSelect.onchange = (e) => {
                this.stateManager.setState({ currentTaskId: e.target.value });
            };
        }

        // Task form
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('name');
                const description = formData.get('description');

                if (this.addTask(name, description)) {
                    e.target.reset();
                }
            };
        }

        // Modal controls
        const dashboardBtn = document.getElementById('dashboard-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const closeDashboard = document.getElementById('close-dashboard');
        const closeSettings = document.getElementById('close-settings');
        const dashboardModal = document.getElementById('dashboard-modal');
        const settingsModal = document.getElementById('settings-modal');

        if (dashboardBtn) dashboardBtn.onclick = () => this.stateManager.setState({ showDashboard: true });
        if (settingsBtn) settingsBtn.onclick = () => this.stateManager.setState({ showSettings: true });
        if (closeDashboard) closeDashboard.onclick = () => this.stateManager.setState({ showDashboard: false });
        if (closeSettings) closeSettings.onclick = () => this.stateManager.setState({ showSettings: false });

        if (dashboardModal) {
            dashboardModal.onclick = (e) => {
                if (e.target === dashboardModal) this.stateManager.setState({ showDashboard: false });
            };
        }
        if (settingsModal) {
            settingsModal.onclick = (e) => {
                if (e.target === settingsModal) this.stateManager.setState({ showSettings: false });
            };
        }

        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);

                const newSettings = {
                    workDuration: parseInt(formData.get('workDuration')),
                    breakDuration: parseInt(formData.get('breakDuration')),
                    longBreakDuration: parseInt(formData.get('longBreakDuration')),
                    longBreakInterval: parseInt(formData.get('longBreakInterval')),
                    notifications: formData.get('notifications') === 'on',
                    autoStartBreaks: formData.get('autoStartBreaks') === 'on',
                    autoStartPomodoros: formData.get('autoStartPomodoros') === 'on'
                };

                this.updateSettings(newSettings);
                this.stateManager.setState({ showSettings: false });
            };
        }
    }

    setupTimer(state) {
        console.log('Setting up timer - isRunning:', state.isRunning, 'timeLeft:', state.timeLeft);

        // Clear existing interval
        if (this.timerInterval) {
            console.log('Clearing existing timer interval');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Setup new interval if timer is running
        if (state.isRunning) {
            console.log('Starting timer interval');
            this.timerInterval = setInterval(() => {
                const currentState = this.stateManager.getState();

                if (currentState.isRunning && currentState.timeLeft > 0) {
                    // Count down normally
                    const newTimeLeft = currentState.timeLeft - 1;
                    console.log('Tick - timeLeft:', newTimeLeft);
                    this.stateManager.setState({ timeLeft: newTimeLeft });
                } else if (currentState.isRunning && currentState.timeLeft <= 0) {
                    // Timer reached 0 - complete it
                    console.log('Timer reached 0, completing timer');
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                    this.handleTimerComplete();
                } else {
                    // Timer stopped
                    console.log('Timer stopped, clearing interval');
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
            }, 1000);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

