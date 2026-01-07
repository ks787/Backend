const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (!projectId) window.location.href = '/dashboard.html';

const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('user-name').textContent = user ? user.name : 'User';

let projectMembers = [];

function logout() {
    api.removeToken();
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Initial Load
async function init() {
    try {
        const project = await api.get(`/projects/${projectId}`);
        document.getElementById('project-title').textContent = project.name;
        projectMembers = project.members;

        // Populate assign dropdown
        const select = document.getElementById('task-assignee');
        projectMembers.forEach(member => {
            const option = document.createElement('option');
            // Check if member is object or id (populated in backend)
            option.value = member._id;
            option.textContent = member.name + ` (${member.email})`;
            select.appendChild(option);
        });

        loadTasks();
    } catch (error) {
        alert('Error loading project: ' + error.message);
        window.location.href = '/dashboard.html';
    }
}

async function loadTasks() {
    try {
        const tasks = await api.get(`/tasks/${projectId}`);

        // Clear lists
        document.getElementById('list-todo').innerHTML = '';
        document.getElementById('list-inprogress').innerHTML = '';
        document.getElementById('list-done').innerHTML = '';

        tasks.forEach(task => {
            renderTask(task);
        });
    } catch (error) {
        console.error(error);
    }
}

function renderTask(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.id = task._id;
    card.ondragstart = drag;

    // Determine list
    let listId = 'list-todo';
    if (task.status === 'In Progress') listId = 'list-inprogress';
    if (task.status === 'Done') listId = 'list-done';

    const assigneeName = task.assignedTo ? task.assignedTo.name : 'Unassigned';

    card.innerHTML = `
        <div style="font-weight: 500; font-size: 15px;">${task.title}</div>
        <div class="task-assignee">${assigneeName}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
             <span class="task-status-badge">${task.status}</span>
             <button onclick="deleteTask(event, '${task._id}')" class="delete-btn">Del</button>
        </div>
    `;

    document.getElementById(listId).appendChild(card);
}

// Drag & Drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

async function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const taskCard = document.getElementById(data);

    // Find drop target (the column list)
    let target = ev.target;
    while (!target.classList.contains('task-list')) {
        target = target.parentElement;
        if (!target) return; // Dropped outside
    }

    const newStatus = target.getAttribute('data-status');

    // Visually move
    target.appendChild(taskCard);

    // Update API
    try {
        await api.put(`/tasks/${data}`, { status: newStatus });

        // Notify others via socket (if chat is connected, we use same socket)
        if (typeof socket !== 'undefined') {
            socket.emit('task_updated', { projectId, taskId: data, status: newStatus });
        }
    } catch (error) {
        console.error('Failed to update task status', error);
        alert('Failed to update status');
        loadTasks(); // Revert
    }
}

// Task Actions
function openAddTaskModal(status) {
    document.getElementById('task-status').value = status;
    document.getElementById('add-task-modal').style.display = 'block';
}

document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const status = document.getElementById('task-status').value;
    const assignedTo = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-date').value;

    try {
        const body = {
            title, description, status, projectId,
            dueDate: dueDate || null
        };
        if (assignedTo) body.assignedTo = assignedTo;

        await api.post('/tasks', body);
        document.getElementById('add-task-modal').style.display = 'none';
        document.getElementById('task-title').value = '';
        loadTasks();

        if (typeof socket !== 'undefined') {
            socket.emit('task_updated', { projectId });
        }
    } catch (error) {
        alert(error.message);
    }
});

async function deleteTask(e, id) {
    e.stopPropagation(); // prevent drag
    if (!confirm('Delete this task?')) return;

    try {
        await api.delete(`/tasks/${id}`);
        document.getElementById(id).remove();
        if (typeof socket !== 'undefined') {
            socket.emit('task_updated', { projectId });
        }
    } catch (error) {
        alert(error.message);
    }
}

// Invite
async function copyInviteLink() {
    try {
        const data = await api.post(`/projects/${projectId}/invite`);
        const inviteUrl = `${window.location.origin}/invite.html?token=${data.inviteToken}`; // We need an invite handler page

        // Hack for clipboard
        const input = document.createElement('input');
        input.value = inviteUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);

        alert('Invite link copied to clipboard!');
    } catch (error) {
        alert('Failed to generate invite');
    }
}

init();
