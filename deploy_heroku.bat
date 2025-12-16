@echo off
echo 🚀 Deploy WhatsApp Bot no Heroku
echo.

echo 1️⃣ Instalando Heroku CLI...
winget install Heroku.CLI

echo.
echo 2️⃣ Fazendo login no Heroku...
heroku login

echo.
echo 3️⃣ Criando app Heroku...
heroku create whatsapp-excel-bot-%RANDOM%

echo.
echo 4️⃣ Inicializando Git...
git init
git add .
git commit -m "Deploy WhatsApp Bot"

echo.
echo 5️⃣ Fazendo deploy...
git push heroku main

echo.
echo ✅ Deploy concluído!
echo 📱 Seu bot está em: https://whatsapp-excel-bot-XXXXX.herokuapp.com
echo 🔧 Configure o webhook no Meta Business com essa URL + /webhook

pause