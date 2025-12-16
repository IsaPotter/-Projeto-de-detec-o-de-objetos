from flask import Flask, request
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from whatsapp_bot import WhatsAppExcelBot
import os

app = Flask(__name__)

# Configurações Twilio - SUBSTITUA PELAS SUAS CREDENCIAIS
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN = "your_auth_token_here"
TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
bot = WhatsAppExcelBot()

@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    # Receber mensagem do WhatsApp
    incoming_msg = request.values.get('Body', '').strip()
    sender_number = request.values.get('From', '')
    
    # Processar com o bot
    resposta = bot.processar_mensagem(incoming_msg, sender_number)
    
    # Criar resposta TwiML
    resp = MessagingResponse()
    resp.message(resposta)
    
    return str(resp)

def enviar_mensagem_whatsapp(numero, mensagem):
    """Enviar mensagem via Twilio WhatsApp"""
    try:
        message = client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            body=mensagem,
            to=numero
        )
        return message.sid
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")
        return None

@app.route('/enviar-teste', methods=['POST'])
def enviar_teste():
    """Endpoint para testar envio de mensagem"""
    data = request.json
    numero = data.get('numero')  # formato: whatsapp:+5511999999999
    mensagem = data.get('mensagem')
    
    message_sid = enviar_mensagem_whatsapp(numero, mensagem)
    
    if message_sid:
        return {'status': 'success', 'message_sid': message_sid}
    else:
        return {'status': 'error', 'message': 'Falha ao enviar'}

if __name__ == '__main__':
    app.run(debug=True, port=5003)