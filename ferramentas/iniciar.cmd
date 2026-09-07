@echo off
setlocal
chcp 65001 > nul
title VITAE
REM A raiz do projeto, e nao a pasta deste .cmd: ele mora em ferramentas/
cd /d "%~dp0.."

echo.
echo   VITAE — Vampiro: A Mascara 5a Ed.
echo   ---------------------------------------------------------
echo.

REM ---------------------------------------------------------------
REM  1. Node. Sem ele nao ha nada.
REM ---------------------------------------------------------------
where node > nul 2>&1
if errorlevel 1 (
  echo   [X] Node nao encontrado. Instale em https://nodejs.org
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo   [ok] Node %%v

REM ---------------------------------------------------------------
REM  2. Ollama. Ja esta de pe? Se nao, sobe.
REM     O proxy tambem sabe subir sozinho, pelo botao da capa — isto
REM     aqui e para quem prefere ligar tudo antes de abrir o navegador.
REM ---------------------------------------------------------------
set "OLLAMA=ollama.exe"
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"

curl -s -m 2 -o nul http://127.0.0.1:11434/api/tags
if errorlevel 1 (
  echo   [..] Subindo o ollama...
  start "" /b "%OLLAMA%" serve
  REM  Primeira partida demora: espera ate 30s, checando a cada 2s.
  for /l %%i in (1,1,15) do (
    timeout /t 2 /nobreak > nul
    curl -s -m 2 -o nul http://127.0.0.1:11434/api/tags && goto :ollama_ok
  )
  echo   [X] O ollama nao respondeu. O jogo abre assim mesmo,
  echo        no modo deterministico — sem IA.
  goto :ollama_fim
)
:ollama_ok
echo   [ok] Ollama no ar
:ollama_fim

REM ---------------------------------------------------------------
REM  3. O servidor. E ele quem serve o app, as campanhas e o /api.
REM ---------------------------------------------------------------
curl -s -m 2 -o nul http://127.0.0.1:5173/api/estado
if errorlevel 1 (
  echo   [..] Subindo o servidor...
  start "VITAE — servidor" /min cmd /c "node modulos/gateway/proxy.mjs"
  for /l %%i in (1,1,10) do (
    timeout /t 1 /nobreak > nul
    curl -s -m 2 -o nul http://127.0.0.1:5173/api/estado && goto :proxy_ok
  )
  echo   [X] O servidor nao subiu. Rode a mao para ver o erro:
  echo        node modulos/gateway/proxy.mjs
  echo.
  pause
  exit /b 1
) else (
  echo   [ok] Servidor ja estava no ar
  goto :abrir
)
:proxy_ok
echo   [ok] Servidor no ar

REM ---------------------------------------------------------------
REM  4. Os QUATRO modulos com porta propria (secoes 78, 83 e 84).
REM     O Gateway tambem sabe subi-los, pelo botao da capa — isto
REM     aqui e para quem prefere ligar tudo antes de abrir o browser.
REM ---------------------------------------------------------------
:abrir
call :subir_modulo "FichaServer" 5174 "/ficha/saude" "modulos/ficha/ficha-servidor.mjs"
call :subir_modulo "MesaServer" 5175 "/mesa/saude" "modulos/mesa/mesa-servidor.mjs"
call :subir_modulo "Arbitro" 5176 "/arbitro/saude" "modulos/arbitro/arbitro-servidor.mjs"
call :subir_modulo "Cronista" 5177 "/cronista/saude" "modulos/cronista/cronista-servidor.mjs"
echo.
echo   ---------------------------------------------------------
echo   Abrindo http://localhost:5173
echo.
echo   O painel "Sistemas", na capa, mostra o que esta ligado
echo   e liga o que faltar.
echo   ---------------------------------------------------------
echo.
start "" http://localhost:5173
timeout /t 3 /nobreak > nul
endlocal
exit /b 0

REM ---------------------------------------------------------------
REM  Subrotina: sobe um modulo se a porta dele nao responder.
REM    %~1 nome legivel   %~2 porta   %~3 rota de saude   %~4 arquivo
REM ---------------------------------------------------------------
:subir_modulo
curl -s -m 2 -o nul http://127.0.0.1:%~2%~3
if not errorlevel 1 (
  echo   [ok] %~1 ja estava no ar
  exit /b 0
)
echo   [..] Subindo o %~1...
start "VITAE — %~1" /min cmd /c "node %~4"
for /l %%i in (1,1,10) do (
  timeout /t 1 /nobreak > nul
  curl -s -m 2 -o nul http://127.0.0.1:%~2%~3 && goto :subir_modulo_ok
)
echo   [X] O %~1 nao subiu. Rode a mao para ver o erro:
echo        node %~4
exit /b 1
:subir_modulo_ok
echo   [ok] %~1 no ar
exit /b 0
