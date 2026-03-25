@echo off
echo 🚀 Starting FreelanceClarity Environment...
echo ⏳ Ensuring both Frontend and Backend are running...

REM Start backend and frontend concurrently
npx.cmd concurrently "npm.cmd run dev --prefix frontend" "npm.cmd run dev --prefix backend"

pause
