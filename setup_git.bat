@echo off
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"

echo Inicializando repositorio Git...
%GIT_PATH% init

echo Agregando archivos...
%GIT_PATH% add .

echo Realizando commit inicial...
%GIT_PATH% commit -m "Subida inicial del proyecto"

echo Renombrando rama a main...
%GIT_PATH% branch -M main

echo Agregando repositorio remoto...
%GIT_PATH% remote remove origin
%GIT_PATH% remote add origin https://github.com/sebastian6253116/AppVerificacionPagoMovil.git

echo Subiendo codigo a GitHub...
%GIT_PATH% push -u origin main

echo Proceso finalizado.
pause
