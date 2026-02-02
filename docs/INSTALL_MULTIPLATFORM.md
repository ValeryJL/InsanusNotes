# Guía de Instalación Multiplataforma

InsanusNotes es ahora completamente multiplataforma y funciona en **Windows 10/11**, **macOS** y **Linux**.

## 🚀 Instalación Rápida

### Windows

1. **Descargar Python** (si no lo tienes):
   - Visita https://www.python.org/downloads/
   - Descarga Python 3.8 o superior
   - **⚠️ IMPORTANTE**: Marca "Add Python to PATH" durante la instalación

2. **Clonar el repositorio**:
   ```cmd
   git clone https://github.com/ValeryJL/InsanusNotes.git
   cd InsanusNotes
   ```

3. **Ejecutar la aplicación**:
   ```cmd
   run.bat
   ```
   
   O si prefieres línea de comandos:
   ```cmd
   python run.py
   ```

### macOS

1. **Python** (generalmente ya está instalado):
   ```bash
   python3 --version
   ```

2. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/ValeryJL/InsanusNotes.git
   cd InsanusNotes
   ```

3. **Ejecutar la aplicación**:
   ```bash
   bash run.sh
   ```
   
   O:
   ```bash
   python3 run.py
   ```

### Linux

1. **Instalar Python** (si no lo tienes):
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install python3 python3-pip git
   
   # Fedora
   sudo dnf install python3 python3-pip git
   
   # Arch
   sudo pacman -S python python-pip git
   ```

2. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/ValeryJL/InsanusNotes.git
   cd InsanusNotes
   ```

3. **Ejecutar la aplicación**:
   ```bash
   bash run.sh
   ```
   
   O:
   ```bash
   python3 run.py
   ```

---

## 📁 Ubicación de Datos

Los datos de InsanusNotes se guardan automáticamente en directorios estándar del SO:

### Windows
- **Configuración y datos**: `%APPDATA%\InsanusNotes`
- **Proyectos (por defecto)**: `%USERPROFILE%\Documents\InsanusNotes`

### macOS
- **Configuración y datos**: `~/Library/Application Support/InsanusNotes`
- **Proyectos (por defecto)**: `~/Documents/InsanusNotes`

### Linux
- **Configuración y datos**: `~/.local/share/InsanusNotes`
- **Proyectos (por defecto)**: `~/Documents/InsanusNotes`

---

## 🔧 Instalación Manual de Dependencias

Si los scripts no funcionan automáticamente, puedes instalar las dependencias manualmente:

```bash
pip install -r requirements.txt
```

Luego ejecuta la aplicación:

```bash
python main.py
```

---

## ✅ Verificar que todo funciona

1. **Abre la aplicación**
2. **Crea un nuevo proyecto**
3. **Verifica que los archivos se guardan en los directorios correctos** (según tu SO)
4. **Prueba crear notas con bloques de texto**

---

## 🐛 Solución de Problemas

### "Python no está instalado"
- **Windows**: Descarga desde https://www.python.org/downloads/ y marca "Add to PATH"
- **macOS**: Instala con `brew install python3` o descarga desde python.org
- **Linux**: Instala con tu gestor de paquetes (apt, dnf, pacman, etc.)

### "No se encuentra el módulo PyQt6"
```bash
pip install PyQt6
```

### "Permiso denegado al crear proyecto"
- **Windows**: Verifica que tienes permisos en Documents
- **Linux/macOS**: Verifica permisos en ~/Documents

### "Archivo bloqueado en Windows"
- Si antivirus bloquea archivos:
  - Agrega la carpeta `%APPDATA%\InsanusNotes` a las excepciones del antivirus
  - Reinicia la aplicación

---

## 📝 Notas de Actualización

Si vienes de una versión anterior (Linux-only):

1. Los datos de configuración ahora se guardan en:
   - **Antes**: `~/.insanusnotes_recent.json`
   - **Ahora**: Según el SO (ver sección "Ubicación de Datos")

2. Los proyectos ahora pueden estar en cualquier lugar
   - Tus proyectos existentes seguirán funcionando
   - Los nuevos proyectos se crearán en `~/Documents/InsanusNotes`

---

## 💡 Consejos

- **Windows 11**: Para mejor integración, usa el tema "dark" automático que detecta tu preferencia del SO
- **macOS**: Los atajos de teclado usan `Cmd` automáticamente en lugar de `Ctrl`
- **Linux**: Soporta temas claros y oscuros automáticamente según tu escritorio

---

## 🚀 Próximos Pasos

- Lee la documentación en `docs/`
- Consulta [CONTRIBUTING.md](CONTRIBUTING.md) si quieres contribuir
- Reporta problemas en [Issues](https://github.com/ValeryJL/InsanusNotes/issues)
