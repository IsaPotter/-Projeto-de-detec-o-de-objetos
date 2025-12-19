from flask import Flask, request, jsonify, render_template_string
import os
from bot_ia import BotIA

app = Flask(__name__)
bot = BotIA()

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Bot IA Assistente</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .chat-container { border: 1px solid #ddd; height: 400px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user { background: #e3f2fd; text-align: right; }
        .bot { background: #f5f5f5; }
        input[type="text"] { width: 70%; padding: 10px; }
        button { padding: 10px 20px; background: #2196f3; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🤖 Bot IA Assistente</h1>
    <div id="chat" class="chat-container"></div>
    <input type="text" id="message" placeholder="Digite sua mensagem...">
    <button onclick="sendMessage()">Enviar</button>
    
    <script>
        function addMessage(text, isUser) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'message ' + (isUser ? 'user' : 'bot');
            div.innerHTML = text.replace(/\\n/g, '<br>');
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function sendMessage() {
            const input = document.getElementById('message');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            input.value = '';
            
            fetch('/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: message})
            })
            .then(r => r.json())
            .then(data => addMessage(data.response, false));
        }
        
        document.getElementById('message').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        
        addMessage('🤖 Olá! Sou seu assistente IA. Como posso ajudar?', false);
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    response = bot.processar_mensagem(message)
    return jsonify({'response': response})

@app.route('/health')
def health():
    return {'status': 'ok'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)