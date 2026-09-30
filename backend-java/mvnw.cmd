@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.
@REM ----------------------------------------------------------------------------
@REM Maven start up batch script for Windows
@REM Requires JAVA_HOME to be set.
@REM ----------------------------------------------------------------------------

@echo off
@setlocal

set WRAPPER_VERSION=3.2.0
set WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/%WRAPPER_VERSION%/maven-wrapper-%WRAPPER_VERSION%.jar"
set WRAPPER_JAR="%~dp0\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%~dp0\.mvn\wrapper\maven-wrapper.properties"

@REM Check JAVA_HOME
if not "%JAVA_HOME%" == "" goto OkJHome
echo.
echo Error: JAVA_HOME is not set.
echo Please install Java JDK 17+ and set JAVA_HOME environment variable.
echo Download from: https://adoptium.net/
echo.
goto error

:OkJHome
if exist "%JAVA_HOME%\bin\java.exe" goto init
echo.
echo Error: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
goto error

:init
@REM Download maven-wrapper.jar if not present
if exist %WRAPPER_JAR% goto execute
echo Downloading Maven Wrapper...
mkdir "%~dp0\.mvn\wrapper" 2>NUL
powershell -Command "(New-Object Net.WebClient).DownloadFile(%WRAPPER_URL%, %WRAPPER_JAR%)"
if not exist %WRAPPER_JAR% (
    echo Failed to download Maven Wrapper. Please check your internet connection.
    goto error
)

:execute
"%JAVA_HOME%\bin\java.exe" ^
  -jar %WRAPPER_JAR% %*
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
