@echo off
REM Script para ejecutar InsanusNotes en Windows

setlocal enabledelayedexpansion

title InsanusNotes Launcher

echo.
echo 🚀 InsanusNotes Launcher
echo ────────────────────────
echo.

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python no está instalado o no está en PATH
    echo    Descarga Python desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION%

REM Verificar e instalar dependencias
echo.
echo Verificando dependencias...
python -m pip install --quiet -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)

echo ✓ Dependencias instaladas/actualizadas
echo.
echo ▶ Iniciando aplicación...
echo.

REM Ejecutar aplicación
python main.py

REM Si ocurre un error, mostrar pausa para ver el mensaje
if %errorlevel% neq 0 (
    pause
)
