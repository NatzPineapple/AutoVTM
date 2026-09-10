@echo off
setlocal
chcp 65001 > nul
title VITAE — testar
REM A raiz do projeto, e nao a pasta deste .cmd: ele mora em ferramentas/
cd /d "%~dp0.."

echo.
echo   VITAE — rodando os testes
echo   ---------------------------------------------------------
echo.

REM ---------------------------------------------------------------
REM  O terceiro do trio, ao lado de iniciar.cmd e desligar.cmd.
REM  Existe para quem prefere um duplo-clique a abrir um terminal e
REM  lembrar o comando — o comando de verdade e so "npm test", e
REM  continua sendo esse: este .cmd nao substitui, so poupa digitar.
REM ---------------------------------------------------------------
where node > nul 2>&1
if errorlevel 1 (
  echo   [X] Node nao encontrado. Instale em https://nodejs.org
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo   [ok] Node %%v
echo.

call npm test
set "SAIDA=%errorlevel%"

echo.
if "%SAIDA%"=="0" (
  echo   ---------------------------------------------------------
  echo   Tudo passou.
  echo   ---------------------------------------------------------
) else (
  echo   ---------------------------------------------------------
  echo   Alguma coisa reprovou. O registro completo:
  echo        ferramentas\testes\registro\ultimo.md
  echo   ou   npm run testes:log
  echo   ---------------------------------------------------------
)
echo.
pause
endlocal
exit /b %SAIDA%
