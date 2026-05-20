@echo off
echo ============================================================
echo   Bpartner AI Service — Python 3.11 venv launcher
echo ============================================================
echo.

REM ── Fix Ollama PATH ───────────────────────────────────────────
SET "OLLAMA_DIR=%LOCALAPPDATA%\Programs\Ollama"
IF EXIST "%OLLAMA_DIR%\ollama.exe" SET "PATH=%OLLAMA_DIR%;%PATH%"

REM ── Activate Python 3.11 venv ─────────────────────────────────
SET "VENV=%~dp0venv\Scripts\activate.bat"
IF NOT EXIST "%VENV%" (
    echo ERROR: venv not found. Run setup first.
    pause & exit /b 1
)
CALL "%VENV%"

echo [OK] Python venv activated
python --version

REM ── Start AI service ──────────────────────────────────────────
echo.
echo Starting AI microservice on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
