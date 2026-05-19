@echo off
title PARKS local server launcher
cd /d "%~dp0"
echo Avvio del server locale PARKS...
powershell -NoProfile -ExecutionPolicy Bypass -File .\Avvia_PARKS.ps1
echo.
echo Se vedi un errore sopra, riportalo ad Antigravity.
pause
