@echo off
setlocal
cd /d "%~dp0"

rem --- Bun finden: erst PATH, sonst Standard-Installationspfad ---
where bun >nul 2>nul
if %errorlevel%==0 (
  set "BUN=bun"
) else if exist "%USERPROFILE%\.bun\bin\bun.exe" (
  set "BUN=%USERPROFILE%\.bun\bin\bun.exe"
) else (
  echo [FEHLER] Bun wurde nicht gefunden. Installiere es mit:
  echo   powershell -c "irm bun.sh/install.ps1 ^| iex"
  pause
  exit /b 1
)

rem --- Abhaengigkeiten bei Bedarf installieren ---
if not exist "node_modules" (
  echo Installiere Abhaengigkeiten ...
  "%BUN%" install
)

echo.
echo Starte Server  (WebSocket + API)  auf Port 3000
echo Starte Client  (Vite Dev-Server)  auf Port 5173
echo.

rem --- Server und Client jeweils in eigenem Fenster ---
start "Wer ist es? - Server" cmd /k ""%BUN%" run dev:server"
start "Wer ist es? - Client" cmd /k ""%BUN%" run dev:client"

rem --- Browser oeffnen ---
timeout /t 3 >nul
start "" http://localhost:5173

echo Fertig. Zum Beenden die beiden Fenster schliessen.
endlocal
