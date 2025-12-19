import json
import re
from datetime import datetime

class BotIA:
    def __init__(self):
        self.produtos = {
            "1": {"nome": "iPhone 15 Pro", "preco": 1299.99, "categoria": "eletrônicos", "estoque": 12},
            "2": {"nome": "MacBook Air M2", "preco": 2899.99, "categoria": "eletrônicos", "estoque": 6},
            "3": {"nome": "Nike Air Max", "preco": 299.99, "categoria": "calçados", "estoque": 18},
            "4": {"nome": "Camiseta Premium", "preco": 79.99, "categoria": "roupas", "estoque": 35},
            "5": {"nome": "Fone Bluetooth", "preco": 199.99, "categoria": "eletrônicos", "estoque": 22}
        }
        self.carrinho = {}
        
    def processar_mensagem(self, mensagem):
        mensagem = mensagem.lower().strip()
        
        if any(palavra in mensagem for palavra in ["olá", "oi", "bom dia", "boa tarde", "hey"]):
            return "🤖 Olá! Sou seu assistente IA. Posso ajudar com produtos, carrinho e muito mais!"
            
        elif "produtos" in mensagem or "catálogo" in mensagem:
            return self.listar_produtos()
            
        elif "buscar" in mensagem:
            termo = self.extrair_termo_busca(mensagem)
            return self.buscar_produtos(termo)
            
        elif "adicionar" in mensagem and "carrinho" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.adicionar_carrinho(produto_id)
            
        elif "carrinho" in mensagem:
            return self.ver_carrinho()
            
        else:
            return "🤖 Posso ajudar com: produtos, buscar, carrinho. O que precisa?"
    
    def listar_produtos(self):
        resultado = "🛍️ **PRODUTOS DISPONÍVEIS**\\n\\n"
        for id_produto, produto in self.produtos.items():
            resultado += f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}\\n"
        return resultado
    
    def buscar_produtos(self, termo):
        if not termo:
            return "Por favor, especifique o que deseja buscar."
            
        encontrados = []
        for id_produto, produto in self.produtos.items():
            if termo in produto['nome'].lower():
                encontrados.append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        if encontrados:
            return f"🔍 **Encontrado:**\\n" + "\\n".join(encontrados)
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
            return "❌ Produto não encontrado."
    
    def ver_carrinho(self):
        if not self.carrinho:
            return "🛒 Seu carrinho está vazio."
        
        resultado = "🛒 **SEU CARRINHO**\\n\\n"
        total = 0
        for produto_id, quantidade in self.carrinho.items():
            produto = self.produtos[produto_id]
            subtotal = produto['preco'] * quantidade
            total += subtotal
            resultado += f"• {produto['nome']} x{quantidade} - R$ {subtotal:.2f}\\n"
        
        resultado += f"\\n💰 **TOTAL: R$ {total:.2f}**"
        return resultado
    
    def extrair_termo_busca(self, mensagem):
        palavras = mensagem.split()
        if "buscar" in palavras:
            idx = palavras.index("buscar")
            if idx + 1 < len(palavras):
                return " ".join(palavras[idx + 1:])
        return ""
    
    def extrair_id_produto(self, mensagem):
        numeros = re.findall(r'\\d+', mensagem)
        return numeros[0] if numeros else None