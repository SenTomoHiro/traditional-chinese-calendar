@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 日历系统当前未运行
  pause >nul
  exit /b 0
)
node "scripts\本地测试控制.mjs" stop
set "RESULT=%ERRORLEVEL%"
if not defined LOCAL_TEST_NO_PAUSE pause >nul
exit /b %RESULT%
