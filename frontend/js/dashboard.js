// Check authentication
const token = api.getToken();
if (!token) {
    window.location.href = '/index.html';
}

const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('user-name').textContent = user ? user.name : 'User';

function logout() {
    api.removeToken();
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Load Projects
async function loadProjects() {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '<p>Loading...</p>';

    try {
        const projects = await api.get('/projects');
        projectsList.innerHTML = '';

        if (projects.length === 0) {
            projectsList.innerHTML = '<p>No projects found. Create one to get started.</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';

            card.innerHTML = `
                <h3 style="margin-bottom: 10px;">${project.name}</h3>
                <p style="opacity: 0.7; font-size: 14px;">${project.members.length} members</p>
            `;

            card.onclick = () => {
                window.location.href = `/project.html?id=${project._id}`;
            };

            projectsList.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        projectsList.innerHTML = '<p style="color: red">Failed to load projects</p>';
    }
}

// Create Project
document.getElementById('create-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('project-name').value;

    try {
        await api.post('/projects', { name });
        document.getElementById('create-project-modal').style.display = 'none';
        document.getElementById('project-name').value = '';
        loadProjects();
    } catch (error) {
        alert(error.message);
    }
});

loadProjects();
