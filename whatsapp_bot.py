from flask import Flask, request, jsonify
import pandas as pd
import openpyxl
from datetime import datetime
import os

class WhatsAppExcelBot:
    def __init__(self):
        self.planilhas_dir = "planilhas"
        if not os.path.exists(self.planilhas_dir):
            os.makedirs(self.planilhas_dir)
    
    def processar_mensagem(self, mensagem, numero_usuario):
        mensagem = mensagem.lower().strip()
        
        if "ola" in mensagem or "oi" in mensagem:
            return "🤖 Olá! Sou seu assistente de planilhas Excel!\n\nPosso ajudar com:\n📊 Criar planilhas\n📈 Gerar relatórios\n🔢 Calcular dados\n📋 Organizar informações\n\nO que precisa hoje?"
        
        elif "criar planilha" in mensagem:
            return self.criar_planilha_basica(numero_usuario)
        
        elif "vendas" in mensagem:
            return self.criar_planilha_vendas(numero_usuario)
        
        elif "estoque" in mensagem:
            return self.criar_planilha_estoque(numero_usuario)
        
        elif "financeiro" in mensagem or "gastos" in mensagem:
            return self.criar_planilha_financeiro(numero_usuario)
        
        elif "clientes" in mensagem:
            return self.criar_planilha_clientes(numero_usuario)
        
        elif "adicionar" in mensagem and "dados" in mensagem:
            return "📝 Para adicionar dados, me envie no formato:\nADICIONAR: Nome da planilha | Dados separados por vírgula\n\nExemplo:\nADICIONAR: Vendas | João, Produto A, 100, 15/12/2024"
        
        elif mensagem.startswith("adicionar:"):
            return self.adicionar_dados(mensagem, numero_usuario)
        
        elif "relatorio" in mensagem:
            return self.gerar_relatorio(numero_usuario)
        
        elif "ajuda" in mensagem or "help" in mensagem:
            return self.mostrar_ajuda()
        
        else:
            return "🤔 Não entendi. Digite 'ajuda' para ver os comandos disponíveis ou me diga que tipo de planilha precisa!"
    
    def criar_planilha_basica(self, numero_usuario):
        try:
            df = pd.DataFrame({
                'Item': ['Exemplo 1', 'Exemplo 2', 'Exemplo 3'],
                'Quantidade': [10, 20, 15],
                'Valor': [100.0, 200.0, 150.0],
                'Data': [datetime.now().strftime('%d/%m/%Y')] * 3
            })
            
            arquivo = f"{self.planilhas_dir}/planilha_basica_{numero_usuario}.xlsx"
            df.to_excel(arquivo, index=False)
            
            return f"✅ Planilha básica criada!\n📁 Arquivo: planilha_basica_{numero_usuario}.xlsx\n\n📊 Contém: Item, Quantidade, Valor, Data\n\nPrecisa de mais alguma coisa?"
        
        except Exception as e:
            return f"❌ Erro ao criar planilha: {str(e)}"
    
    def criar_planilha_vendas(self, numero_usuario):
        try:
            df = pd.DataFrame({
                'Data': [datetime.now().strftime('%d/%m/%Y')] * 3,
                'Vendedor': ['João Silva', 'Maria Santos', 'Pedro Costa'],
                'Cliente': ['Empresa A', 'Empresa B', 'Empresa C'],
                'Produto': ['Produto X', 'Produto Y', 'Produto Z'],
                'Quantidade': [5, 10, 3],
                'Valor_Unitario': [50.0, 30.0, 100.0],
                'Total': [250.0, 300.0, 300.0],
                'Comissao': [25.0, 30.0, 30.0]
            })
            
            arquivo = f"{self.planilhas_dir}/vendas_{numero_usuario}.xlsx"
            df.to_excel(arquivo, index=False)
            
            return f"📈 Planilha de Vendas criada!\n📁 Arquivo: vendas_{numero_usuario}.xlsx\n\n📊 Inclui:\n• Controle de vendedores\n• Produtos e quantidades\n• Cálculo automático de comissões\n• Total de vendas\n\nQuer adicionar mais dados?"
        
        except Exception as e:
            return f"❌ Erro ao criar planilha de vendas: {str(e)}"
    
    def criar_planilha_estoque(self, numero_usuario):
        try:
            df = pd.DataFrame({
                'Codigo': ['001', '002', '003', '004'],
                'Produto': ['Notebook Dell', 'Mouse Logitech', 'Teclado Mecânico', 'Monitor 24"'],
                'Categoria': ['Informática', 'Periféricos', 'Periféricos', 'Monitores'],
                'Estoque_Atual': [15, 50, 25, 8],
                'Estoque_Minimo': [5, 20, 10, 3],
                'Preco_Custo': [1500.0, 80.0, 200.0, 800.0],
                'Preco_Venda': [2000.0, 120.0, 300.0, 1200.0],
                'Status': ['OK', 'OK', 'OK', 'BAIXO']
            })
            
            arquivo = f"{self.planilhas_dir}/estoque_{numero_usuario}.xlsx"
            df.to_excel(arquivo, index=False)
            
            return f"📦 Planilha de Estoque criada!\n📁 Arquivo: estoque_{numero_usuario}.xlsx\n\n📊 Controla:\n• Produtos e códigos\n• Estoque atual vs mínimo\n• Preços de custo e venda\n• Status automático\n\nPrecisa de mais categorias?"
        
        except Exception as e:
            return f"❌ Erro ao criar planilha de estoque: {str(e)}"
    
    def criar_planilha_financeiro(self, numero_usuario):
        try:
            df = pd.DataFrame({
                'Data': ['01/12/2024', '05/12/2024', '10/12/2024', '15/12/2024'],
                'Tipo': ['Receita', 'Despesa', 'Receita', 'Despesa'],
                'Categoria': ['Vendas', 'Aluguel', 'Serviços', 'Fornecedores'],
                'Descricao': ['Venda produtos', 'Aluguel loja', 'Consultoria', 'Compra materiais'],
                'Valor': [5000.0, -2000.0, 1500.0, -800.0],
                'Saldo': [5000.0, 3000.0, 4500.0, 3700.0]
            })
            
            arquivo = f"{self.planilhas_dir}/financeiro_{numero_usuario}.xlsx"
            df.to_excel(arquivo, index=False)
            
            return f"💰 Planilha Financeira criada!\n📁 Arquivo: financeiro_{numero_usuario}.xlsx\n\n📊 Controla:\n• Receitas e despesas\n• Categorização automática\n• Saldo acumulado\n• Fluxo de caixa\n\nQuer adicionar mais movimentações?"
        
        except Exception as e:
            return f"❌ Erro ao criar planilha financeira: {str(e)}"
    
    def criar_planilha_clientes(self, numero_usuario):
        try:
            df = pd.DataFrame({
                'ID': [1, 2, 3, 4],
                'Nome': ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'],
                'Email': ['joao@email.com', 'maria@email.com', 'pedro@email.com', 'ana@email.com'],
                'Telefone': ['11999999999', '11888888888', '11777777777', '11666666666'],
                'Empresa': ['Tech Corp', 'Inovação Ltda', 'Soluções SA', 'Digital Inc'],
                'Cidade': ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília'],
                'Status': ['Ativo', 'Ativo', 'Inativo', 'Ativo'],
                'Ultima_Compra': ['15/12/2024', '10/12/2024', '01/11/2024', '20/12/2024']
            })
            
            arquivo = f"{self.planilhas_dir}/clientes_{numero_usuario}.xlsx"
            df.to_excel(arquivo, index=False)
            
            return f"👥 Planilha de Clientes criada!\n📁 Arquivo: clientes_{numero_usuario}.xlsx\n\n📊 Organiza:\n• Dados completos dos clientes\n• Contatos e empresas\n• Status e histórico\n• Controle de relacionamento\n\nPrecisa de mais campos?"
        
        except Exception as e:
            return f"❌ Erro ao criar planilha de clientes: {str(e)}"
    
    def mostrar_ajuda(self):
        return """📋 **COMANDOS DISPONÍVEIS:**

📊 **CRIAR PLANILHAS:**
• "criar planilha" - Planilha básica
• "vendas" - Controle de vendas
• "estoque" - Gestão de estoque  
• "financeiro" - Controle financeiro
• "clientes" - Base de clientes

📝 **ADICIONAR DADOS:**
• "adicionar dados" - Instruções
• ADICIONAR: nome | dados

📈 **RELATÓRIOS:**
• "relatorio" - Gerar relatório

❓ **AJUDA:**
• "ajuda" - Este menu

Exemplo: Digite "vendas" para criar planilha de vendas!"""

app = Flask(__name__)
bot = WhatsAppExcelBot()

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    
    # Simular estrutura do WhatsApp Business API
    if 'messages' in data:
        for message in data['messages']:
            numero = message.get('from', '')
            texto = message.get('text', {}).get('body', '')
            
            resposta = bot.processar_mensagem(texto, numero)
            
            return jsonify({
                'messages': [{
                    'to': numero,
                    'text': {'body': resposta}
                }]
            })
    
    return jsonify({'status': 'ok'})

@app.route('/test', methods=['POST'])
def test_bot():
    data = request.json
    mensagem = data.get('mensagem', '')
    numero = data.get('numero', '5511999999999')
    
    resposta = bot.processar_mensagem(mensagem, numero)
    return jsonify({'resposta': resposta})

if __name__ == '__main__':
    app.run(debug=True, port=5002)