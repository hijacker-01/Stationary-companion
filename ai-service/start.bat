@echo off
echo ============================================================
echo   Bpartner AI Service Setup + Launcher
echo ============================================================
echo.

REM ── Step 1: Check Ollama ──────────────────────────────────────
echo [1/4] Checking Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Ollama is NOT installed.
    echo  Please download it from: https://ollama.com/download
    echo  Install it, then run this script again.
    echo.
    pause
    exit /b 1
)
echo  Ollama found!

REM ── Step 2: Pull models ───────────────────────────────────────
echo.
echo [2/4] Pulling AI models (this takes a few minutes first time)...
echo  Pulling llama3.2 (2GB)...
ollama pull llama3.2:3b
echo  Pulling nomic-embed-text (274MB)...
ollama pull nomic-embed-text
echo  Models ready!

REM ── Step 3: Install Python deps ──────────────────────────────
echo.
echo [3/4] Installing Python dependencies...
cd /d "%~dp0"
python -m pip install -r requirements.txt --quiet
echo  Python packages installed!

REM ── Step 4: Start the AI service ─────────────────────────────
echo.
echo [4/4] Starting AI microservice on http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
