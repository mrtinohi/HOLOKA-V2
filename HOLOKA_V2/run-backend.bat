@echo off
title HOLOKA Backend
if exist "C:\Program Files\Java\jdk-21.0.12" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12"
) else if exist "C:\Program Files\Java\latest" (
    set "JAVA_HOME=C:\Program Files\Java\latest"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SERVER_PORT=8081"
cd /d "%~dp0backend"
echo ========================================================
echo          HOLOKA Backend (Spring Boot - Port 8081)
echo ========================================================
call mvnw.cmd spring-boot:run
pause
