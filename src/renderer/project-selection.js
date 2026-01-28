let selectedPath = '';

async function loadRecentProjects() {
  try {
    const projects = await window.api.projects.getRecent();
    const projectList = document.getElementById('projectList');
    
    if (projects.length === 0) {
      projectList.innerHTML = '<div class="empty-state">No recent projects</div>';
      return;
    }
    
    projectList.innerHTML = projects.map(project => `
      <div class="project-item" onclick="openProject('${project.path.replace(/'/g, "\\'")}')">
        <div class="project-name">${project.name}</div>
        <div class="project-path">${project.path}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load recent projects:', error);
  }
}

function showCreateModal() {
  document.getElementById('createModal').classList.add('active');
  document.getElementById('projectName').focus();
}

function hideCreateModal() {
  document.getElementById('createModal').classList.remove('active');
  document.getElementById('projectName').value = '';
  document.getElementById('projectPath').value = '';
  selectedPath = '';
}

async function selectFolder() {
  try {
    const path = await window.api.projects.selectFolder();
    if (path) {
      selectedPath = path;
      document.getElementById('projectPath').value = path;
    }
  } catch (error) {
    console.error('Failed to select folder:', error);
    alert('Failed to select folder');
  }
}

async function createProject() {
  const name = document.getElementById('projectName').value.trim();
  
  if (!name) {
    alert('Please enter a project name');
    return;
  }
  
  if (!selectedPath) {
    alert('Please select a project location');
    return;
  }
  
  try {
    const projectPath = `${selectedPath}/${name}`;
    await window.api.projects.create(name, projectPath);
    // Window will close automatically and main window will open
  } catch (error) {
    console.error('Failed to create project:', error);
    alert('Failed to create project: ' + error.message);
  }
}

async function openExistingProject() {
  try {
    const path = await window.api.projects.selectFolder();
    if (path) {
      await openProject(path);
    }
  } catch (error) {
    console.error('Failed to open project:', error);
    alert('Failed to open project: ' + error.message);
  }
}

async function openProject(path) {
  try {
    await window.api.projects.open(path);
    // Window will close automatically and main window will open
  } catch (error) {
    console.error('Failed to open project:', error);
    alert('Failed to open project: ' + error.message);
  }
}

// Load recent projects on page load
document.addEventListener('DOMContentLoaded', () => {
  loadRecentProjects();
});
