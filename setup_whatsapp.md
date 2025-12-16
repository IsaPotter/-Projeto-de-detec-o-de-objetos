# 📱 Como Configurar WhatsApp Business API

## 🔧 Passo a Passo Meta Business

### 1. Criar Conta Meta Business
- Acesse: https://business.facebook.com
- Crie conta empresarial
- Adicione método de pagamento

### 2. Configurar WhatsApp Business
- Vá em "WhatsApp" no menu
- Adicione número de telefone
- Verifique o número

### 3. Obter Credenciais
- **Phone Number ID**: Encontre em "Configurações > API"
- **Access Token**: Gere token permanente
- **Webhook Token**: Crie token personalizado

### 4. Configurar Webhook
- URL: `https://seudominio.com/webhook`
- Token de verificação: `meu_token_verificacao_123`
- Eventos: `messages`

### 5. Atualizar Código
```python
# Em whatsapp_meta.py
VERIFY_TOKEN = "seu_token_aqui"
ACCESS_TOKEN = "EAAxxxxxxx"  # Token do Meta
PHONE_NUMBER_ID = "123456789"  # ID do seu número
```

### 6. Testar
```bash
python whatsapp_meta.py
```

## 🌐 Requisitos
- ✅ Domínio público (não localhost)
- ✅ Certificado SSL (HTTPS)
- ✅ Número WhatsApp Business verificado
- ✅ Meta Business aprovado

## 💰 Custos Meta
- **Gratuito**: 1.000 conversas/mês
- **Pago**: $0.005 - $0.009 por conversa
- **Sem taxa de setup**

## 🚀 Deploy Recomendado
- **Heroku**: Fácil e gratuito
- **Railway**: Simples deploy
- **DigitalOcean**: VPS completo

## 📞 Suporte
- Documentação: https://developers.facebook.com/docs/whatsapp
- Comunidade: https://developers.facebook.com/community