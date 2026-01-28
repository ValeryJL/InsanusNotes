# File Creation Troubleshooting Guide

## Issue: Can't Create Files or Folders

If you're experiencing issues creating files or folders in InsanusNotes, follow these steps:

### Step 1: Verify Project is Open

**The most common issue is that the app opened but no project was selected.**

1. When you start the app, you should see the **Project Selection Window**
2. You must either:
   - **Create a New Project** (click "New Project" button)
   - **Open an Existing Project** (click "Open Project" button)
3. Only after a project is selected will the main window open

**If you clicked the X to close the project selection window without selecting a project, the app may have opened but no project is loaded.**

### Step 2: Check Browser Console

1. In the main window, press **F12** or **Ctrl+Shift+I** (Linux/Windows) or **Cmd+Option+I** (Mac)
2. Click the **Console** tab
3. Try to create a file/folder
4. Look for error messages in red

**Common errors you might see:**

```
Error: No directory selected. Please select a folder first.
```
**Solution:** You need to open a project first. Restart the app and select a project.

```
Failed to load project: Error: No project found at /path/to/project
```
**Solution:** The project folder doesn't have a `.insanusnote.config` file. Create a new project instead.

```
EACCES: permission denied
```
**Solution:** You don't have write permissions in the project directory. Choose a different location or fix permissions.

### Step 3: Check Terminal Output

The terminal where you ran `npm start` shows the main process logs:

**Look for:**
```
Creating file: /path/to/project/myfile.md
File created successfully: /path/to/project/myfile.md
```

**Common errors:**
```
Error creating file: EACCES: permission denied
```
**Solution:** Fix directory permissions:
```bash
chmod -R u+w /path/to/your/project
```

### Step 4: Verify Project Structure

A valid project should have:
```
MyProject/
├── .insanusnote.config    # Project configuration file
├── notes/                 # (created automatically)
├── interfaces/            # (created automatically)
└── data/                  # (created automatically)
```

**Check if `.insanusnote.config` exists:**
```bash
ls -la /path/to/your/project/.insanusnote.config
```

If it doesn't exist, the project wasn't properly created.

### Step 5: Restart and Create New Project

If issues persist:

1. **Close the app completely**
2. **Restart:** `npm start`
3. When the Project Selection Window appears, click **"New Project"**
4. Enter a project name: `TestProject`
5. Select a location where you have write permissions (e.g., your home directory)
6. Click **"Create"**
7. Wait for the main window to open
8. Try creating a file in the file explorer

### Step 6: Test File Creation Manually

To verify it's not a permissions issue:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Try creating a file manually
touch test.md

# Try creating a folder manually
mkdir test-folder

# If these fail, it's a permissions issue
```

### Step 7: Enable Debug Mode

For detailed debugging, open DevTools before doing anything:

1. Start the app: `npm start`
2. When any window opens, immediately press **F12**
3. Go to Console tab
4. Watch the logs as you:
   - Select/create a project
   - Click create file/folder buttons
5. Share the console output if asking for help

### Expected Console Output (Success)

When file creation works, you should see:
```
Loaded project: {name: "MyProject", path: "/home/user/MyProject", ...}
Current path set to: /home/user/MyProject
Loading files from: /home/user/MyProject
Files loaded: 3 items
Creating file: /home/user/MyProject/test.md
File created successfully
```

### Common Issues Summary

| Symptom | Cause | Solution |
|---------|-------|----------|
| Create buttons do nothing | No project opened | Open/create a project |
| "No directory selected" error | Project not loaded | Restart and select project |
| Permission denied | No write access | Change permissions or location |
| Files created but not visible | File watcher not running | Restart app |
| Can't find project | `.insanusnote.config` missing | Create new project |

### Still Not Working?

1. **Check the main README.md** for general troubleshooting
2. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   npm start
   ```

3. **Create an issue** on GitHub with:
   - Console output (F12 → Console)
   - Terminal output
   - Operating system
   - Steps to reproduce

### Quick Test

To quickly verify everything works:

```bash
# 1. Clean build
rm -rf node_modules dist
npm install
npm run build

# 2. Start app
npm start

# 3. In Project Selection Window:
#    - Click "New Project"
#    - Name: "QuickTest"
#    - Location: Your home directory
#    - Click "Create"

# 4. In main window:
#    - Click 📄 icon in file explorer
#    - Enter: "test.md"
#    - Press OK

# 5. You should see test.md appear in the file list
```

If this works, your setup is correct!
