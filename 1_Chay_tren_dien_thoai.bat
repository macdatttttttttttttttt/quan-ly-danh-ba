@echo off
chcp 65001 >nul
cd /d "%~dp0danh-ba"
if not exist node_modules call npm install
echo Quet ma QR bang app Expo Go tren dien thoai (cung mang Wi-Fi).
call npx expo start
pause
