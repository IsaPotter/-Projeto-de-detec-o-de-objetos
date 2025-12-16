from flask import Flask, render_template, request, jsonify, redirect, url_for
from agente_ecommerce import AgenteEcommerce

app = Flask(__name__)
agente = AgenteEcommerce()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/produtos')
def produtos():
    return render_template('produtos.html', produtos=agente.produtos)

@app.route('/carrinho')
def carrinho():
    return render_template('carrinho.html', carrinho=agente.carrinho, produtos=agente.produtos)

@app.route('/sobre')
def sobre():
    return render_template('sobre.html')

@app.route('/api/chat', methods=['POST'])
def api_chat():
    mensagem = request.json.get('mensagem', '')
    resposta = agente.processar_mensagem(mensagem)
    return jsonify({'resposta': resposta})

@app.route('/api/adicionar/<produto_id>')
def api_adicionar(produto_id):
    resultado = agente.adicionar_carrinho(produto_id)
    return jsonify({'status': 'success', 'mensagem': resultado})

@app.route('/api/finalizar')
def api_finalizar():
    resultado = agente.finalizar_compra()
    return jsonify({'status': 'success', 'mensagem': resultado})

if __name__ == '__main__':
    app.run(debug=True, port=5000)