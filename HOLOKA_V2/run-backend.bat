@echo off
title HOLOKA Backend
set "JAVA_HOME=C:\Program Files\Java\jdk-24"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0backend"
echo ========================================================
echo          HOLOKA Backend (Spring Boot - Port 8081)
echo ========================================================
mvnw.cmd spring-boot:run
pause
