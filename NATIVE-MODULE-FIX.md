# Native Module Fix - better-sqlite3 for Electron

## Problem

When trying to create or open a project, the following error occurred:

```
Error: The module '/path/to/better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 137. This version of Node.js requires
NODE_MODULE_VERSION 143.
```

## Root Cause

**better-sqlite3** is a native Node.js addon (written in C++) that must be compiled for the specific Node.js/V8 version being used. 

The issue occurs because:
1. `npm install` compiles native modules for your system's Node.js version
2. Electron uses its own embedded Node.js version (different from system Node.js)
3. The compiled `.node` file is incompatible between different Node.js versions

**Version mismatch:**
- System Node.js: NODE_MODULE_VERSION 137 (Node.js v20.x)
- Electron 40: NODE_MODULE_VERSION 143 (Electron's embedded Node.js v23.x)

## Solution

The fix uses **electron-rebuild** to recompile native modules specifically for Electron's Node.js version.

### What Was Added

1. **electron-rebuild package** (devDependency)
   - Tool that rebuilds native modules for Electron
   - Knows which Node.js version Electron uses

2. **postinstall script** in package.json
   ```json
   "postinstall": "electron-rebuild -f -w better-sqlite3"
   ```
   - Runs automatically after `npm install`
   - `-f`: Force rebuild
   - `-w better-sqlite3`: Only rebuild better-sqlite3 (faster)

3. **rebuild script** in package.json
   ```json
   "rebuild": "electron-rebuild -f -w better-sqlite3"
   ```
   - Manual rebuild command: `npm run rebuild`
   - Useful for troubleshooting

### How It Works

```
npm install
  ↓
Downloads packages
  ↓
Compiles native modules for system Node.js
  ↓
postinstall script runs
  ↓
electron-rebuild recompiles for Electron
  ↓
✓ better-sqlite3 now works in Electron!
```

## Usage

### Automatic (Recommended)

Simply run:
```bash
npm install
```

The postinstall script handles everything automatically.

### Manual Rebuild

If you encounter issues:
```bash
npm run rebuild
```

### Fresh Install

If problems persist:
```bash
rm -rf node_modules
npm install
```

## Why This Works

1. **Webpack externals** already configured (from user's previous commit):
   ```javascript
   externals: {
     'better-sqlite3': 'commonjs2 better-sqlite3'
   }
   ```
   This tells webpack NOT to bundle better-sqlite3, allowing Electron to load it at runtime.

2. **electron-rebuild** ensures the native module matches Electron's Node.js version

3. **Automatic rebuild** via postinstall means it "just works" after `npm install`

## Verification

After the fix, the module loads correctly:

```bash
$ npm run rebuild
✔ Rebuild Complete

$ npm run build
✓ Build successful

$ npm start
✓ App launches without errors
✓ Projects can be created/opened
```

## Technical Details

### NODE_MODULE_VERSION Chart

| Platform | Version | MODULE_VERSION |
|----------|---------|----------------|
| Node.js 20.x | v20.20.0 | 137 |
| Electron 40 | Node 23.x | 143 |

### Affected Modules

Only native modules need rebuilding:
- ✅ **better-sqlite3** - Database (native)
- ❌ React - Pure JavaScript (no rebuild needed)
- ❌ TipTap - Pure JavaScript (no rebuild needed)
- ❌ Chokidar - Pure JavaScript (no rebuild needed)

### Alternative Solutions Considered

1. **Use different SQLite library** - Would require major refactoring
2. **Use @electron/remote** - Deprecated and not recommended
3. **Use better-sqlite3-multiple-ciphers** - Unnecessary complexity
4. ✅ **electron-rebuild** - Standard solution, minimal changes

## For Future Contributors

### Adding New Native Modules

If you add another native Node.js module:

1. Add to package.json dependencies
2. Update postinstall script:
   ```json
   "postinstall": "electron-rebuild -f -w better-sqlite3,new-native-module"
   ```

### Common Native Modules in Electron

- **better-sqlite3** - SQLite database
- **node-gyp** - Build tool for native addons
- **sqlite3** - Alternative SQLite (not used here)
- **leveldown** - LevelDB bindings
- **sharp** - Image processing

## References

- [Electron Documentation: Native Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- [electron-rebuild GitHub](https://github.com/electron/rebuild)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

## Summary

The fix is simple and automatic:
- ✅ Installs electron-rebuild
- ✅ Adds postinstall script
- ✅ Rebuilds better-sqlite3 for Electron
- ✅ Documents the solution
- ✅ Works automatically on npm install

No code changes needed - just build tool configuration! 🎉
