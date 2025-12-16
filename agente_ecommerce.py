import json
import re
from datetime import datetime

class AgenteEcommerce:
    def __init__(self):
        self.produtos = {
            "1": {"nome": "iPhone 15 Pro", "preco": 1299.99, "categoria": "eletrônicos", "estoque": 12, "descricao": "Smartphone premium com chip A17 Pro"},
            "2": {"nome": "MacBook Air M2", "preco": 2899.99, "categoria": "eletrônicos", "estoque": 6, "descricao": "Notebook ultrafino com chip M2"},
            "3": {"nome": "Nike Air Max", "preco": 299.99, "categoria": "calçados", "estoque": 18, "descricao": "Tênis esportivo confortável"},
            "4": {"nome": "Camiseta Premium", "preco": 79.99, "categoria": "roupas", "estoque": 35, "descricao": "100% algodão orgânico"},
            "5": {"nome": "Fone Bluetooth", "preco": 199.99, "categoria": "eletrônicos", "estoque": 22, "descricao": "Cancelamento de ruído ativo"},
            "6": {"nome": "Smartwatch", "preco": 399.99, "categoria": "eletrônicos", "estoque": 14, "descricao": "Monitor de saúde e fitness"},
            "7": {"nome": "Jaqueta Jeans", "preco": 149.99, "categoria": "roupas", "estoque": 28, "descricao": "Estilo casual moderno"},
            "8": {"nome": "Mochila Executiva", "preco": 129.99, "categoria": "acessórios", "estoque": 16, "descricao": "Compartimento para laptop"}
        }
        self.carrinho = {}
        self.historico_compras = []
        
    def processar_mensagem(self, mensagem):
        mensagem = mensagem.lower().strip()
        
        if any(palavra in mensagem for palavra in ["olá", "oi", "bom dia", "boa tarde", "hey"]):
            return "🛍️ Olá! Bem-vindo à nossa loja virtual! Sou seu assistente pessoal de compras. Posso ajudar com:\n\n• Ver catálogo de produtos\n• Buscar itens específicos\n• Gerenciar seu carrinho\n• Consultar preços e estoque\n• Finalizar pedidos\n\nO que gostaria de fazer hoje?"
            
        elif "produtos" in mensagem or "catálogo" in mensagem:
            return self.listar_produtos()
            
        elif "buscar" in mensagem or "procurar" in mensagem:
            termo = self.extrair_termo_busca(mensagem)
            return self.buscar_produtos(termo)
            
        elif "adicionar" in mensagem and "carrinho" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.adicionar_carrinho(produto_id)
            
        elif "carrinho" in mensagem:
            return self.ver_carrinho()
            
        elif "finalizar" in mensagem or "comprar" in mensagem:
            return self.finalizar_compra()
            
        elif "limpar carrinho" in mensagem:
            return self.limpar_carrinho()
            
        elif "categoria" in mensagem:
            categoria = self.extrair_categoria(mensagem)
            return self.listar_por_categoria(categoria)
            
        elif "preço" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.consultar_preco(produto_id)
            
        elif "estoque" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.consultar_estoque(produto_id)
            
        else:
            return self.resposta_geral(mensagem)
    
    def listar_produtos(self):
        resultado = "🛍️ **CATÁLOGO DE PRODUTOS**\n\n"
        categorias = {}
        for id_produto, produto in self.produtos.items():
            cat = produto['categoria']
            if cat not in categorias:
                categorias[cat] = []
            categorias[cat].append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        for categoria, produtos in categorias.items():
            resultado += f"📂 **{categoria.upper()}**\n"
            for produto in produtos:
                resultado += f"   {produto}\n"
            resultado += "\n"
        return resultado
    
    def buscar_produtos(self, termo):
        if not termo:
            return "Por favor, especifique o que deseja buscar."
            
        encontrados = []
        for id_produto, produto in self.produtos.items():
            if termo in produto['nome'].lower() or termo in produto['categoria'].lower():
                encontrados.append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        if encontrados:
            return f"🔍 **Produtos encontrados para '{termo}':**\n" + "\n".join(encontrados)
        else:
            return f"❌ Nenhum produto encontrado para '{termo}'"
    
    def adicionar_carrinho(self, produto_id):
        if produto_id in self.produtos:
            if produto_id in self.carrinho:
                self.carrinho[produto_id] += 1
            else:
                self.carrinho[produto_id] = 1
            
            produto = self.produtos[produto_id]
            return f"✅ {produto['nome']} adicionado ao carrinho!"
        else:
            return "❌ Produto não encontrado. Use o ID correto do produto."
    
    def ver_carrinho(self):
        if not self.carrinho:
            return "🛒 Seu carrinho está vazio.\n\n💡 Dica: Digite 'produtos' para ver nosso catálogo!"
        
        resultado = "🛒 **SEU CARRINHO DE COMPRAS**\n\n"
        total = 0
        for produto_id, quantidade in self.carrinho.items():
            produto = self.produtos[produto_id]
            subtotal = produto['preco'] * quantidade
            total += subtotal
            resultado += f"• {produto['nome']} x{quantidade} - R$ {subtotal:.2f}\n"
        
        resultado += f"\n💰 **TOTAL: R$ {total:.2f}**\n\n"
        resultado += "💡 Digite 'finalizar' para concluir a compra ou 'limpar carrinho' para esvaziar."
        return resultado
    
    def consultar_preco(self, produto_id):
        if produto_id in self.produtos:
            produto = self.produtos[produto_id]
            return f"💰 {produto['nome']}: R$ {produto['preco']:.2f}"
        else:
            return "❌ Produto não encontrado."
    
    def consultar_estoque(self, produto_id):
        if produto_id in self.produtos:
            produto = self.produtos[produto_id]
            return f"📦 {produto['nome']}: {produto['estoque']} unidades disponíveis"
        else:
            return "❌ Produto não encontrado."
    
    def finalizar_compra(self):
        if not self.carrinho:
            return "❌ Seu carrinho está vazio. Adicione produtos antes de finalizar a compra."
        
        total = sum(self.produtos[id_produto]['preco'] * qtd for id_produto, qtd in self.carrinho.items())
        pedido = {
            'itens': self.carrinho.copy(),
            'total': total,
            'data': datetime.now().strftime('%d/%m/%Y %H:%M')
        }
        self.historico_compras.append(pedido)
        self.carrinho.clear()
        
        return f"✅ **COMPRA FINALIZADA COM SUCESSO!**\n\nTotal pago: R$ {total:.2f}\nPedido registrado em: {pedido['data']}\n\nObrigado pela preferência! 🎉"
    
    def limpar_carrinho(self):
        if not self.carrinho:
            return "🛒 Seu carrinho já está vazio."
        self.carrinho.clear()
        return "🗑️ Carrinho limpo com sucesso!"
    
    def listar_por_categoria(self, categoria):
        if not categoria:
            return "Por favor, especifique uma categoria (eletrônicos, roupas, calçados, acessórios)."
        
        encontrados = []
        for id_produto, produto in self.produtos.items():
            if categoria.lower() in produto['categoria'].lower():
                encontrados.append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        if encontrados:
            return f"📂 **Produtos da categoria '{categoria}':**\n" + "\n".join(encontrados)
        else:
            return f"❌ Nenhum produto encontrado na categoria '{categoria}'"
    
    def extrair_categoria(self, mensagem):
        palavras = mensagem.split()
        if "categoria" in palavras:
            idx = palavras.index("categoria")
            if idx + 1 < len(palavras):
                return " ".join(palavras[idx + 1:])
        return ""
    
    def extrair_termo_busca(self, mensagem):
        palavras = mensagem.split()
        if "buscar" in palavras:
            idx = palavras.index("buscar")
            if idx + 1 < len(palavras):
                return " ".join(palavras[idx + 1:])
        return ""
    
    def extrair_id_produto(self, mensagem):
        numeros = re.findall(r'\d+', mensagem)
        return numeros[0] if numeros else None
    
    def resposta_geral(self, mensagem):
        # Respostas para perguntas comuns
        respostas = {
            "como você funciona": "Sou um assistente de IA criado para ajudar com compras online. Uso processamento de linguagem natural para entender suas necessidades e oferecer suporte personalizado.",
            "quem é você": "Sou seu assistente virtual de e-commerce! Posso ajudar com produtos, carrinho, preços e responder suas dúvidas sobre compras.",
            "que horas são": f"Agora são {datetime.now().strftime('%H:%M')} do dia {datetime.now().strftime('%d/%m/%Y')}.",
            "que dia é hoje": f"Hoje é {datetime.now().strftime('%d/%m/%Y')}, {self.dia_semana()}.",
            "como está o tempo": "Não tenho acesso a informações meteorológicas, mas posso ajudar com suas compras!",
            "qual seu nome": "Sou o Assistente Virtual da Loja! Pode me chamar de IA Shopping.",
            "você é humano": "Não, sou uma inteligência artificial criada para tornar sua experiência de compra mais fácil e divertida!",
            "como posso pagar": "Aceitamos cartão de crédito, débito, PIX e boleto bancário. O pagamento é processado de forma segura.",
            "entrega": "Fazemos entregas em todo o Brasil! O prazo varia de 1 a 7 dias úteis dependendo da sua localização.",
            "devolução": "Você tem 30 dias para devolver produtos. Entre em contato conosco para iniciar o processo.",
            "garantia": "Todos os produtos têm garantia do fabricante. Eletrônicos: 1 ano, roupas e calçados: 90 dias.",
            "desconto": "Temos promoções especiais! Cadastre-se na newsletter para receber ofertas exclusivas.",
            "ajuda": "Posso ajudar com: \n• Ver produtos e preços\n• Adicionar ao carrinho\n• Buscar itens\n• Informações sobre entrega\n• Responder dúvidas gerais",
            "obrigado": "De nada! Fico feliz em ajudar. Há mais alguma coisa que posso fazer por você?",
            "tchau": "Até logo! Volte sempre que precisar. Tenha um ótimo dia! 👋",
            "problema": "Sinto muito pelo inconveniente. Pode me contar qual problema está enfrentando? Vou fazer o possível para ajudar."
        }
        
        # Busca por palavras-chave na mensagem
        for palavra_chave, resposta in respostas.items():
            if palavra_chave in mensagem.lower():
                return resposta
        
        # Respostas baseadas em contexto
        if "por que" in mensagem or "porque" in mensagem:
            return "Essa é uma boa pergunta! Como assistente de e-commerce, foco em ajudar com compras. Para questões mais complexas, recomendo consultar fontes especializadas."
        
        if "como" in mensagem:
            return "Posso explicar como usar nossa loja: navegue pelos produtos, adicione ao carrinho e finalize a compra. Precisa de ajuda com algo específico?"
        
        if "onde" in mensagem:
            return "Nossa loja é virtual! Você pode acessar de qualquer lugar. Para entregas, atendemos todo o Brasil."
        
        if "quando" in mensagem:
            return "Os prazos variam: entrega de 1-7 dias, atendimento 24h online, promoções semanais. Sobre o que gostaria de saber?"
        
        if any(palavra in mensagem for palavra in ["legal", "bom", "gostei", "perfeito", "excelente"]):
            return "Que bom que gostou! 😊 Estou aqui para tornar sua experiência ainda melhor. Posso ajudar com mais alguma coisa?"
        
        if any(palavra in mensagem for palavra in ["ruim", "péssimo", "horrivel", "problema"]):
            return "Sinto muito que não esteja satisfeito. 😔 Como posso melhorar e ajudar você? Seu feedback é muito importante!"
        
        # Resposta padrão inteligente
        return f"Interessante pergunta! Como assistente de e-commerce, posso ajudar principalmente com compras, produtos e informações da loja. Sobre '{mensagem}', posso sugerir que você:\n\n• Veja nossos produtos digitando 'produtos'\n• Faça uma busca específica\n• Pergunte sobre entrega, pagamento ou garantia\n\nComo posso ajudar melhor?"
    
    def dia_semana(self):
        dias = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo']
        return dias[datetime.now().weekday()]

# Interface de chat simples
def main():
    agente = AgenteEcommerce()
    print("🛍️ Agente E-commerce iniciado! Digite 'sair' para encerrar.\n")
    
    while True:
        mensagem = input("Você: ")
        if mensagem.lower() in ['sair', 'quit', 'exit']:
            print("Obrigado por usar nosso assistente! Até logo! 👋")
            break
        
        resposta = agente.processar_mensagem(mensagem)
        print(f"Assistente: {resposta}\n")

if __name__ == "__main__":
    main()