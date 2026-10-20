@echo off
title سيرفر الشامل نت المحلي
chcp 65001 >nul
echo ========================================================
echo        جاري تشغيل سيرفر الشامل نت المحلي...
echo ========================================================

cd /d "c:\Users\LENOVO\Documents\antigravity\noble-maxwell"

set "NODE_PATH=C:\Users\LENOVO\AppData\Local\Temp\node-portable\node-v20.18.0-win-x64"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

set NODE_ENV=production
set PORT=3000

echo.
echo [✓] السيرفر يعمل الآن بنجاح على المنفذ 3000!
echo [✓] للفتح من جهازك: http://localhost:3000
echo [✓] للفتح من جوالات المشتركين داخل الشبكة: http://172.16.222.192:3000
echo.
echo تنبيه: اترك هذه النافذة مفتوحة دائماً طالما تريد للشبكة بيع الكروت.
echo ========================================================
echo.

if exist "%NODE_PATH%\node.exe" (
    "%NODE_PATH%\node.exe" dist/index.js
) else (
    node dist/index.js
)

pause
