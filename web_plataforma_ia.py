from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from agente_assinaturas import AgenteAssinaturasIA
from database import Database
from auth import login_required, get_current_user, login_user, logout_user
from pagamentos import ProcessadorPagamentos
from security import SecurityManager
import os
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

agente = AgenteAssinaturasIA()
db = Database()
pagamentos = ProcessadorPagamentos()
security = SecurityManager()

@app.route('/')
def home():
    return render_template('plataforma_home.html')

@app.route('/planos')
def planos():
    return render_template('planos_ia.html', planos=agente.planos)

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = get_current_user()
    assinaturas = db.get_assinaturas_usuario(user_id)
    return render_template('dashboard_ia.html', assinaturas=assinaturas)

@app.route('/chat-ia')
def chat_ia():
    return render_template('chat_ia.html')

@app.route('/pagamento')
@login_required
def pagamento():
    return render_template('pagamento.html')

@app.route('/pagamento/<plano_id>')
@login_required
def pagamento_plano(plano_id):
    plano = agente.planos.get(plano_id)
    return render_template('pagamento.html', plano_id=plano_id, plano=plano)

@app.route('/contato')
def contato():
    return render_template('contato.html')

@app.route('/whatsapp-demo')
def whatsapp_demo():
    return render_template('whatsapp_demo.html')

@app.route('/privacidade')
def privacidade():
    return render_template('politica_privacidade.html')

# APIs
@app.route('/api/cadastro', methods=['POST'])
@security.rate_limit(max_requests=5, window=300)
def api_cadastro():
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip().lower()
        senha = data.get('senha', '')
        
        # Validações
        if not nome or len(nome) < 2:
            return jsonify({'error': 'Nome deve ter pelo menos 2 caracteres'}), 400
            
        if not email or '@' not in email:
            return jsonify({'error': 'Email inválido'}), 400
            
        if not senha or len(senha) < 8:
            return jsonify({'error': 'Senha deve ter pelo menos 8 caracteres'}), 400
            
        # Validar senha segura
        import re
        if len(senha) > 128:  # Prevenir ataques de buffer overflow
            return jsonify({'error': 'Senha muito longa'}), 400
        if not re.search(r'[A-Z]', senha):
            return jsonify({'error': 'Senha deve conter pelo menos uma letra maiúscula'}), 400
        if not re.search(r'[a-z]', senha):
            return jsonify({'error': 'Senha deve conter pelo menos uma letra minúscula'}), 400
        if not re.search(r'\d', senha):
            return jsonify({'error': 'Senha deve conter pelo menos um número'}), 400
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', senha):
            return jsonify({'error': 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)'}), 400
        
        # Criar usuário
        user_id = db.criar_usuario(nome, email, senha)
        if user_id:
            login_user(user_id, nome, email)
            return jsonify({
                'success': True, 
                'message': f'Bem-vindo {nome}! Cadastro realizado com sucesso!',
                'redirect': '/dashboard'
            })
        else:
            return jsonify({'error': 'Este email já está cadastrado. Tente fazer login.'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/cadastro-google', methods=['POST'])
def api_cadastro_google():
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip().lower()
        
        if not nome or not email:
            return jsonify({'error': 'Dados do Google incompletos'}), 400
            
        if not email or '@' not in email:
            return jsonify({'error': 'Email inválido'}), 400
        
        # Criar usuário com senha temporária (Google auth)
        import secrets
        senha_temporaria = secrets.token_urlsafe(16)
        
        user_id = db.criar_usuario(nome, email, senha_temporaria)
        if user_id:
            login_user(user_id, nome, email)
            return jsonify({
                'success': True, 
                'message': f'Bem-vindo {nome}! Conta criada com Google!',
                'redirect': '/dashboard'
            })
        else:
            return jsonify({'error': 'Este email já está cadastrado. Tente fazer login.'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/login', methods=['POST'])
@security.rate_limit(max_requests=5, window=300)
def api_login():
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    
    user = db.autenticar_usuario(email, senha)
    if user:
        login_user(user[0], user[1], user[2])
        return jsonify({'success': True, 'message': 'Login realizado com sucesso!'})
    else:
        return jsonify({'error': 'Email ou senha inválidos'}), 401

@app.route('/api/logout')
def api_logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/api/chat-ia', methods=['POST'])
def api_chat_ia():
    mensagem = request.json.get('mensagem', '')
    resposta = agente.processar_mensagem(mensagem)
    return jsonify({'resposta': resposta})

@app.route('/api/contratar/<plano_id>')
@login_required
def api_contratar(plano_id):
    try:
        user_id = get_current_user()
        plano = agente.planos.get(plano_id)
        
        if not plano:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        # Verificar se já tem assinatura ativa
        assinaturas_ativas = db.get_assinaturas_usuario(user_id)
        if assinaturas_ativas:
            return jsonify({'error': 'Você já possui uma assinatura ativa'}), 400
        
        # Redirecionar para pagamento
        return jsonify({
            'success': True,
            'redirect': f'/pagamento/{plano_id}',
            'message': f'Redirecionando para pagamento do {plano["nome"]}'
        })
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/pagamento', methods=['POST'])
@login_required
@security.rate_limit(max_requests=3, window=60)
def api_pagamento():
    try:
        data = request.get_json()
        user_id = get_current_user()
        plano_id = data.get('plano_id')
        metodo = data.get('metodo')
        dados_pagamento = data.get('dados_pagamento', {})
        
        if not plano_id or not metodo:
            return jsonify({'error': 'Dados incompletos'}), 400
        
        plano = agente.planos.get(plano_id)
        if not plano:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        valor_original = plano['preco']
        usuario = db.get_usuario_por_id(user_id)
        
        # Processar pagamento baseado no método
        if metodo == 'pix':
            resultado = pagamentos.processar_pix(valor_original, user_id)
        elif metodo == 'cartao':
            resultado = pagamentos.processar_cartao(valor_original, dados_pagamento)
        elif metodo == 'boleto':
            resultado = pagamentos.processar_boleto(valor_original, user_id)
        elif metodo == 'paypal':
            resultado = pagamentos.processar_paypal(valor_original, usuario[2] if usuario else '')
        else:
            return jsonify({'error': 'Método de pagamento inválido'}), 400
        
        if resultado['status'] == 'recusado':
            return jsonify({'error': resultado.get('erro', 'Pagamento recusado')}), 400
        
        # Criar assinatura se pagamento aprovado ou pendente
        duracao = 365 if plano['tipo'] == 'anual' else 30
        assinatura_id = db.criar_assinatura(user_id, plano_id, resultado['valor_final'], duracao)
        
        if not assinatura_id:
            return jsonify({'error': 'Erro ao criar assinatura'}), 500
        
        # Registrar pagamento no banco
        pagamento_id = db.criar_pagamento(user_id, assinatura_id, resultado['valor_final'], metodo)
        
        # Preparar resposta baseada no método
        resposta = {
            'success': True,
            'status': resultado['status'],
            'valor_original': valor_original,
            'valor_final': resultado['valor_final'],
            'metodo': metodo,
            'plano': plano['nome'],
            'pagamento_id': pagamento_id
        }
        
        if metodo == 'pix':
            resposta.update({
                'message': f'PIX gerado! Desconto de 5% aplicado!',
                'codigo_pix': resultado['codigo'],
                'qr_code': resultado['qr_code'],
                'vencimento': resultado['vencimento'].strftime('%d/%m/%Y %H:%M'),
                'instrucoes': resultado['instrucoes']
            })
        elif metodo == 'cartao':
            resposta.update({
                'message': f'Pagamento aprovado! Bandeira: {resultado["bandeira"]}',
                'transacao_id': resultado['transacao_id'],
                'autorizacao': resultado['autorizacao']
            })
        elif metodo == 'boleto':
            resposta.update({
                'message': 'Boleto gerado com sucesso!',
                'codigo_barras': resultado['codigo_barras'],
                'linha_digitavel': resultado['linha_digitavel'],
                'vencimento': resultado['vencimento'].strftime('%d/%m/%Y'),
                'instrucoes': resultado['instrucoes']
            })
        elif metodo == 'paypal':
            resposta.update({
                'message': 'Redirecionando para PayPal...',
                'paypal_id': resultado['paypal_id'],
                'url_redirect': resultado['url_redirect']
            })
        
        return jsonify(resposta)
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response

if __name__ == '__main__':
    app.run(debug=False, port=5001, ssl_context='adhoc')