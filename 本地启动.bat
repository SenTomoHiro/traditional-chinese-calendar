@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js，再重新双击本文件。
  pause >nul
  exit /b 1
)
node "scripts\本地测试控制.mjs" start
set "RESULT=%ERRORLEVEL%"
if not defined LOCAL_TEST_NO_PAUSE pause >nul
exit /b %RESULT%
