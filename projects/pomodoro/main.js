// TIMER CODE
let secs = 25 * 60, t, running = false;
const timeEl = document.getElementById('time');
const currentTaskSelect = document.getElementById('current-task-select');

function fmt(s) {
    const m = Math.floor(s / 60), r = s % 60;
    return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}

function render() { timeEl.textContent = fmt(secs); }

function tick() {
    if (secs > 0) { secs--; render(); }
    else {
        clearInterval(t);
        running = false;
        alert('Time!');
        incrementPomodoroForCurrentTask();
    }
}

document.getElementById('start').addEventListener('click', () => {
    if (running) return;
    running = true;
    t = setInterval(tick, 1000);
});

document.getElementById('reset').addEventListener('click', () => {
    clearInterval(t); running = false; secs = 25*60; render();
});

render();

// ---------------- TASK PANEL CODE ----------------
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateTaskDropdown() {
    currentTaskSelect.innerHTML = '<option value="">-- Select task --</option>';
    tasks.forEach((task, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = task.name;
        currentTaskSelect.appendChild(opt);
    });
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${task.name}${task.desc ? ' - ' + task.desc : ''} ${task.pomodoros ? '(' + task.pomodoros + ' 🍅)' : ''}</span>
            <span class="task-buttons">
                <button onclick="editTask(${index})">Edit</button>
                <button onclick="deleteTask(${index})">Delete</button>
            </span>
        `;
        taskList.appendChild(li);
    });
    updateTaskDropdown();
}

// Add task
taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('task-name').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    if (!name) return;
    tasks.push({name, desc, pomodoros: 0});
    saveTasks();
    renderTasks();
    taskForm.reset();
});

// Edit task
window.editTask = function(index) {
    const newName = prompt('Edit task name', tasks[index].name);
    if (newName !== null) tasks[index].name = newName.trim() || tasks[index].name;
    const newDesc = prompt('Edit description', tasks[index].desc);
    if (newDesc !== null) tasks[index].desc = newDesc.trim();
    saveTasks();
    renderTasks();
}

// Delete task
window.deleteTask = function(index) {
    if (confirm('Delete this task?')) {
        tasks.splice(index,1);
        saveTasks();
        renderTasks();
    }
}

// Increment Pomodoro count for selected task
function incrementPomodoroForCurrentTask() {
    const taskIndex = currentTaskSelect.value;
    if (taskIndex !== "") {
        tasks[taskIndex].pomodoros = (tasks[taskIndex].pomodoros || 0) + 1;
        saveTasks();
        renderTasks();
    }
}

renderTasks();
