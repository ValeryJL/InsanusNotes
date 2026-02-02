#!/bin/bash
# Script para ejecutar InsanusNotes en Linux/macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 InsanusNotes Launcher"
echo "────────────────────────"

# Verificar Python
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python ${PYTHON_VERSION}"

# Verificar dependencias
echo ""
echo "Verificando dependencias..."
python3 -m pip install --quiet -r requirements.txt

echo "✓ Dependencias instaladas/actualizadas"
echo ""
echo "▶ Iniciando aplicación..."
echo ""

# Ejecutar aplicación
python3 main.py
