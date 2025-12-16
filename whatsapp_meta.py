from flask import Flask, request, jsonify
import requests
import json
from whatsapp_bot import WhatsAppExcelBot

app = Flask(__name__)
bot = WhatsAppExcelBot()

# Configurações Meta WhatsApp Business API
APP_ID = "2061692981350692"
VERIFY_TOKEN = "meu_token_verificacao_123"
ACCESS_TOKEN = "EAAdTGU3KESQBQM1KsmPnRyd5l491KLnAr33fOEFWQ7NOCy3smzikOBaL9maFbZBNNMEnwZAohhWNPfQwpXZAgIBqdqTTP6XmV8hh9FYNMSgj0pXburZBklm6hYlY0HCnVU1ZCdpzO7Go5XwKryjCTfywfCTKJRi6YZBtFEiqq2PmNuElt9ZAENen4EiR7xXN0dbPK8pYyarF4YMxk9TE68dfma9l5PZCAkK9lh9klnNzHpZBvtReT1n9afg7pT1DmueqdXvpRSCLZBcPguD4p7kPUwyR0P"
PHONE_NUMBER_ID = "830058340201031"

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """Verificação do webhook pelo Meta"""
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    
    if mode == 'subscribe' and token == VERIFY_TOKEN:
        print("Webhook verificado com sucesso!")
        return challenge
    else:
        return "Falha na verificação", 403

@app.route('/webhook', methods=['POST'])
def webhook():
    """Receber mensagens do WhatsApp"""
    try:
        data = request.get_json()
        
        if 'entry' in data:
            for entry in data['entry']:
                if 'changes' in entry:
                    for change in entry['changes']:
                        if 'value' in change and 'messages' in change['value']:
                            messages = change['value']['messages']
                            
                            for message in messages:
                                sender_id = message['from']
                                message_text = message.get('text', {}).get('body', '')
                                
                                # Processar mensagem com o bot
                                resposta = bot.processar_mensagem(message_text, sender_id)
                                
                                # Enviar resposta
                                enviar_mensagem(sender_id, resposta)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        print(f"Erro no webhook: {e}")
        return jsonify({'status': 'error'}), 500

def enviar_mensagem(phone_number, message_text):
    """Enviar mensagem via Meta WhatsApp API"""
    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message_text
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            print(f"Mensagem enviada para {phone_number}")
            return True
        else:
            print(f"Erro ao enviar mensagem: {response.text}")
            return False
    except Exception as e:
        print(f"Erro na requisição: {e}")
        return False

def enviar_planilha(phone_number, arquivo_path, caption=""):
    """Enviar arquivo de planilha via WhatsApp"""
    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Primeiro, fazer upload do arquivo
    media_url = fazer_upload_arquivo(arquivo_path)
    
    if media_url:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "document",
            "document": {
                "link": media_url,
                "caption": caption,
                "filename": arquivo_path.split('/')[-1]
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao enviar arquivo: {e}")
            return False
    
    return False

def fazer_upload_arquivo(arquivo_path):
    """Upload de arquivo para Meta"""
    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/media"
    
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    
    try:
        with open(arquivo_path, 'rb') as arquivo:
            files = {
                'file': arquivo,
                'type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'messaging_product': 'whatsapp'
            }
            
            response = requests.post(url, headers=headers, files=files)
            
            if response.status_code == 200:
                media_id = response.json().get('id')
                return f"https://graph.facebook.com/v18.0/{media_id}"
            
    except Exception as e:
        print(f"Erro no upload: {e}")
    
    return None

@app.route('/teste-envio', methods=['POST'])
def teste_envio():
    """Endpoint para testar envio de mensagem"""
    data = request.json
    numero = data.get('numero')  # formato: 5511999999999
    mensagem = data.get('mensagem')
    
    sucesso = enviar_mensagem(numero, mensagem)
    
    if sucesso:
        return jsonify({'status': 'success', 'message': 'Mensagem enviada!'})
    else:
        return jsonify({'status': 'error', 'message': 'Falha ao enviar'})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5004))
    print("🚀 Bot WhatsApp Meta iniciado!")
    print("📱 Configure o webhook em: https://seudominio.com/webhook")
    print(f"🔑 Token de verificação: {VERIFY_TOKEN}")
    app.run(host='0.0.0.0', port=port, debug=False)