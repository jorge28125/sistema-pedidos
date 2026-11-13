@echo off
title Sistema de Pedidos
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: No se encontro Node.js. Instala Node.js 22.16 a 24.x.
  pause
  exit /b 1
)

if not exist "server\node_modules\express" (
  echo Instalando dependencias del servidor...
  pushd server
  call npm install --no-audit --no-fund
  if errorlevel 1 goto error
  popd
)

if not exist "client\node_modules\vite" (
  echo Instalando dependencias del frontend...
  pushd client
  call npm install --no-audit --no-fund
  if errorlevel 1 goto error
  popd
)

echo.
echo Compilando la interfaz actualizada...
pushd client
call npm run build
if errorlevel 1 goto error
popd

echo.
echo  SISTEMA DE PEDIDOS
 echo  Inicio:  http://localhost:3001/
 echo  Cliente: http://localhost:3001/pedido?mesa=1
 echo  Panel:   http://localhost:3001/admin/login
 echo  Cocina:  http://localhost:3001/cocina
 echo  QR:      http://localhost:3001/admin/qr
 echo.
echo  Presiona Ctrl+C para detener el servidor.
echo.

start "" cmd /c "timeout /t 4 >nul & start http://localhost:3001/"

pushd server
call npm start
popd
pause
exit /b 0

:error
echo.
echo Ocurrio un error instalando o compilando el proyecto.
echo Revisa los mensajes anteriores y vuelve a intentarlo.
pause
exit /b 1
