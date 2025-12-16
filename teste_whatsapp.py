import requests

# Configurações extraídas do seu curl
ACCESS_TOKEN = "EAAdTGU3KESQBQM1KsmPnRyd5l491KLnAr33fOEFWQ7NOCy3smzikOBaL9maFbZBNNMEnwZAohhWNPfQwpXZAgIBqdqTTP6XmV8hh9FYNMSgj0pXburZBklm6hYlY0HCnVU1ZCdpzO7Go5XwKryjCTfywfCTKJRi6YZBtFEiqq2PmNuElt9ZAENen4EiR7xXN0dbPK8pYyarF4YMxk9TE68dfma9l5PZCAkK9lh9klnNzHpZBvtReT1n9afg7pT1DmueqdXvpRSCLZBcPguD4p7kPUwyR0P"
PHONE_NUMBER_ID = "830058340201031"

def testar_envio_mensagem():
    """Testar envio de mensagem simples"""
    url = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Mensagem de texto simples
    payload = {
        "messaging_product": "whatsapp",
        "to": "5577998731012",  # Seu número de teste
        "type": "text",
        "text": {
            "body": "🤖 Olá! Seu bot WhatsApp Excel está funcionando!\n\nDigite 'vendas' para criar uma planilha de vendas!"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Mensagem enviada com sucesso!")
            return True
        else:
            print("❌ Erro ao enviar mensagem")
            return False
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

def testar_template():
    """Testar template (como no seu curl)"""
    url = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": "5577998731012",
        "type": "template",
        "template": {
            "name": "jaspers_market_plain_text_v1",
            "language": {
                "code": "en_US"
            }
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Template Status: {response.status_code}")
        print(f"Template Resposta: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Template enviado com sucesso!")
            return True
        else:
            print("❌ Erro ao enviar template")
            return False
            
    except Exception as e:
        print(f"❌ Erro no template: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testando WhatsApp Business API...")
    print(f"📱 Phone Number ID: {PHONE_NUMBER_ID}")
    print(f"📞 Número de teste: 5577998731012")
    print("-" * 50)
    
    # Teste 1: Mensagem simples
    print("1️⃣ Testando mensagem de texto...")
    testar_envio_mensagem()
    
    print("\n" + "-" * 50)
    
    # Teste 2: Template
    print("2️⃣ Testando template...")
    testar_template()
    
    print("\n✅ Testes concluídos!")