@echo off
title سيرفر الشامل لخدمات الإنترنت
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_PATH=C:\Users\LENOVO\AppData\Local\Temp\node-portable\node-v20.18.0-win-x64"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

set NODE_ENV=production
set PORT=3000

echo ========================================================
echo        جاري تشغيل سيرفر الشامل على الشبكة الداخلية...
echo ========================================================
echo.
echo [*] الرابط الداخلي من هذا الكمبيوتر:
echo     http://localhost:3000
echo.
echo [*] الرابط الداخلي لصفحة الدخول وجوالات الشبكة:
echo     http://172.16.253.167:3000
echo.
echo [*] رابط تنزيل تطبيق APK الداخلي:
echo     http://172.16.253.167:3000/al-shamel.apk
echo.
echo [!] تنبيه: لا تغلق هذه النافذة طالما تريد إبقاء الرابط شغالاً.
echo ========================================================
echo.

if exist "%NODE_PATH%\node.exe" (
    "%NODE_PATH%\node.exe" dist/index.js
) else (
    node dist/index.js
)

pause
