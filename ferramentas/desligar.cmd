@echo off
setlocal
chcp 65001 > nul
title VITAE — desligar
REM A raiz do projeto, e nao a pasta deste .cmd: ele mora em ferramentas/
cd /d "%~dp0.."

echo.
echo   VITAE — desligando
echo   ---------------------------------------------------------
echo.

REM ---------------------------------------------------------------
REM  O par do iniciar.cmd. Existe para quem fechou o navegador antes
REM  de usar o botao da capa, e ficou com dois processos Node e um
REM  modelo de 12B ocupando memoria sem ninguem olhando.
REM
REM  PEDE, NAO MATA. A rota /api/desligar do Gateway derruba os
REM  modulos NA ORDEM CERTA — o MesaServer grava as sessoes antes de
REM  sair — depois o ollama, e por ultimo ele mesmo. `taskkill` aqui
REM  perderia a sessao que ainda nao passou pelo autosave.
REM ---------------------------------------------------------------
curl -s -m 2 -o nul http://127.0.0.1:5173/api/estado
if errorlevel 1 (
  echo   [ok] O servidor ja nao estava respondendo.
  echo        Nada a desligar pelo caminho educado.
  goto :sobras
)

echo   [..] Pedindo o desligamento ao Gateway...
curl -s -m 60 -X POST http://127.0.0.1:5173/api/desligar ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://127.0.0.1:5173" ^
  -d "{\"ollama\":true,\"modulos\":true,\"servidor\":true}"
echo.
echo   [ok] Pedido enviado.

:sobras
REM ---------------------------------------------------------------
REM  A conferencia. Se alguma porta ficou de pe, o pedido educado
REM  falhou e quem esta na maquina precisa saber DISSO — nao de um
REM  "pronto" que nao aconteceu.
REM ---------------------------------------------------------------
timeout /t 2 /nobreak > nul
echo.
set "SOBROU="
call :conferir "Gateway"     5173 "/api/estado"
call :conferir "FichaServer" 5174 "/ficha/saude"
call :conferir "MesaServer"  5175 "/mesa/saude"
call :conferir "Arbitro"     5176 "/arbitro/saude"
call :conferir "Cronista"    5177 "/cronista/saude"
call :conferir "Ollama"      11434 "/api/tags"

echo.
if defined SOBROU (
  echo   ---------------------------------------------------------
  echo   Alguma coisa continuou de pe. Para forcar:
  echo        taskkill /IM ollama.exe /F /T
  echo        taskkill /IM node.exe /F
  echo   O segundo mata TODO Node desta maquina, inclusive o que
  echo   nao e do VITAE. Saiba o que esta rodando antes.
  echo   ---------------------------------------------------------
) else (
  echo   Tudo desligado.
)
echo.
timeout /t 4 /nobreak > nul
endlocal
exit /b 0

REM  %~1 nome legivel   %~2 porta   %~3 rota de saude
:conferir
curl -s -m 2 -o nul http://127.0.0.1:%~2%~3
if errorlevel 1 (
  echo   [ok] %~1 parado
) else (
  echo   [X] %~1 AINDA RESPONDE na porta %~2
  set "SOBROU=1"
)
exit /b 0
