import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig } from '../../shared/types';

const CONFIG_FILE = '.insanusnote.config';
const RECENT_PROJECTS_FILE = 'recent-projects.json';

export class ProjectManager {
  private currentProject: ProjectConfig | null = null;
  private recentProjectsPath: string;

  constructor(private appDataPath: string) {
    this.recentProjectsPath = path.join(appDataPath, RECENT_PROJECTS_FILE);
    
    // Ensure app data directory exists
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
  }

  async createProject(name: string, projectPath: string): Promise<ProjectConfig> {
    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Create subdirectories
    const notesPath = path.join(projectPath, 'notes');
    const interfacesPath = path.join(projectPath, 'interfaces');
    const dataPath = path.join(projectPath, 'data');

    [notesPath, interfacesPath, dataPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Create project config
    const config: ProjectConfig = {
      name,
      path: projectPath,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: '',
      author: '',
      notesPath: 'notes',
      interfacesPath: 'interfaces',
      dataPath: 'data'
    };

    // Write config file
    const configPath = path.join(projectPath, CONFIG_FILE);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // Add to recent projects
    await this.addToRecentProjects(config);

    this.currentProject = config;
    return config;
  }

  async openProject(projectPath: string): Promise<ProjectConfig> {
    const configPath = path.join(projectPath, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
      throw new Error(`No project found at ${projectPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: ProjectConfig = JSON.parse(configContent);

    // Update path in case it was moved
    config.path = projectPath;
    config.updatedAt = Date.now();

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // Add to recent projects
    await this.addToRecentProjects(config);

    this.currentProject = config;
    return config;
  }

  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }

  async getRecentProjects(): Promise<ProjectConfig[]> {
    if (!fs.existsSync(this.recentProjectsPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.recentProjectsPath, 'utf-8');
      const projects: ProjectConfig[] = JSON.parse(content);
      
      // Filter out projects that no longer exist
      return projects.filter(project => {
        const configPath = path.join(project.path, CONFIG_FILE);
        return fs.existsSync(configPath);
      });
    } catch (error) {
      console.error('Failed to read recent projects:', error);
      return [];
    }
  }

  private async addToRecentProjects(project: ProjectConfig): Promise<void> {
    let recentProjects = await this.getRecentProjects();

    // Remove if already exists
    recentProjects = recentProjects.filter(p => p.path !== project.path);

    // Add to beginning
    recentProjects.unshift(project);

    // Keep only last 10
    recentProjects = recentProjects.slice(0, 10);

    // Save
    fs.writeFileSync(
      this.recentProjectsPath,
      JSON.stringify(recentProjects, null, 2),
      'utf-8'
    );
  }

  getProjectNotesPath(): string {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }
    return path.join(
      this.currentProject.path,
      this.currentProject.notesPath || 'notes'
    );
  }

  getProjectInterfacesPath(): string {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }
    return path.join(
      this.currentProject.path,
      this.currentProject.interfacesPath || 'interfaces'
    );
  }

  getProjectDataPath(): string {
    if (!this.currentProject) {
      throw new Error('No project opened');
    }
    return path.join(
      this.currentProject.path,
      this.currentProject.dataPath || 'data'
    );
  }
}
