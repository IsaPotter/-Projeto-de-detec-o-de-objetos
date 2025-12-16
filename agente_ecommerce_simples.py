import json
import re
from datetime import datetime

class AgenteEcommerce:
    def __init__(self):
        self.produtos = {
            "1": {"nome": "iPhone 15 Pro", "preco": 1299.99, "categoria": "eletronicos", "estoque": 12},
            "2": {"nome": "MacBook Air M2", "preco": 2899.99, "categoria": "eletronicos", "estoque": 6},
            "3": {"nome": "Nike Air Max", "preco": 299.99, "categoria": "calcados", "estoque": 18},
            "4": {"nome": "Camiseta Premium", "preco": 79.99, "categoria": "roupas", "estoque": 35},
            "5": {"nome": "Fone Bluetooth", "preco": 199.99, "categoria": "eletronicos", "estoque": 22},
            "6": {"nome": "Smartwatch", "preco": 399.99, "categoria": "eletronicos", "estoque": 14},
            "7": {"nome": "Jaqueta Jeans", "preco": 149.99, "categoria": "roupas", "estoque": 28},
            "8": {"nome": "Mochila Executiva", "preco": 129.99, "categoria": "acessorios", "estoque": 16}
        }
        self.carrinho = {}
        self.historico_compras = []
        
    def processar_mensagem(self, mensagem):
        mensagem = mensagem.lower().strip()
        
        if any(palavra in mensagem for palavra in ["ola", "oi", "bom dia", "boa tarde", "hey"]):
            return ">> Ola! Bem-vindo a nossa loja virtual! Sou seu assistente pessoal de compras.\n\nPosso ajudar com:\n- Ver catalogo de produtos\n- Buscar itens especificos\n- Gerenciar seu carrinho\n- Consultar precos e estoque\n- Finalizar pedidos\n\nO que gostaria de fazer hoje?"
            
        elif "produtos" in mensagem or "catalogo" in mensagem:
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
            
        elif "preco" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.consultar_preco(produto_id)
            
        elif "estoque" in mensagem:
            produto_id = self.extrair_id_produto(mensagem)
            return self.consultar_estoque(produto_id)
            
        else:
            return self.resposta_geral(mensagem)
    
    def listar_produtos(self):
        resultado = "** CATALOGO DE PRODUTOS **\n\n"
        categorias = {}
        for id_produto, produto in self.produtos.items():
            cat = produto['categoria']
            if cat not in categorias:
                categorias[cat] = []
            categorias[cat].append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        for categoria, produtos in categorias.items():
            resultado += f">> {categoria.upper()}\n"
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
            return f"** Produtos encontrados para '{termo}': **\n" + "\n".join(encontrados)
        else:
            return f"Nenhum produto encontrado para '{termo}'"
    
    def adicionar_carrinho(self, produto_id):
        if produto_id in self.produtos:
            if produto_id in self.carrinho:
                self.carrinho[produto_id] += 1
            else:
                self.carrinho[produto_id] = 1
            
            produto = self.produtos[produto_id]
            return f">> {produto['nome']} adicionado ao carrinho!"
        else:
            return "Produto nao encontrado. Use o ID correto do produto."
    
    def ver_carrinho(self):
        if not self.carrinho:
            return "Seu carrinho esta vazio.\n\nDica: Digite 'produtos' para ver nosso catalogo!"
        
        resultado = "** SEU CARRINHO DE COMPRAS **\n\n"
        total = 0
        for produto_id, quantidade in self.carrinho.items():
            produto = self.produtos[produto_id]
            subtotal = produto['preco'] * quantidade
            total += subtotal
            resultado += f"- {produto['nome']} x{quantidade} - R$ {subtotal:.2f}\n"
        
        resultado += f"\n** TOTAL: R$ {total:.2f} **\n\n"
        resultado += "Digite 'finalizar' para concluir a compra ou 'limpar carrinho' para esvaziar."
        return resultado
    
    def consultar_preco(self, produto_id):
        if produto_id in self.produtos:
            produto = self.produtos[produto_id]
            return f"{produto['nome']}: R$ {produto['preco']:.2f}"
        else:
            return "Produto nao encontrado."
    
    def consultar_estoque(self, produto_id):
        if produto_id in self.produtos:
            produto = self.produtos[produto_id]
            return f"{produto['nome']}: {produto['estoque']} unidades disponiveis"
        else:
            return "Produto nao encontrado."
    
    def finalizar_compra(self):
        if not self.carrinho:
            return "Seu carrinho esta vazio. Adicione produtos antes de finalizar a compra."
        
        total = sum(self.produtos[id_produto]['preco'] * qtd for id_produto, qtd in self.carrinho.items())
        pedido = {
            'itens': self.carrinho.copy(),
            'total': total,
            'data': datetime.now().strftime('%d/%m/%Y %H:%M')
        }
        self.historico_compras.append(pedido)
        self.carrinho.clear()
        
        return f"** COMPRA FINALIZADA COM SUCESSO! **\n\nTotal pago: R$ {total:.2f}\nPedido registrado em: {pedido['data']}\n\nObrigado pela preferencia!"
    
    def limpar_carrinho(self):
        if not self.carrinho:
            return "Seu carrinho ja esta vazio."
        self.carrinho.clear()
        return "Carrinho limpo com sucesso!"
    
    def listar_por_categoria(self, categoria):
        if not categoria:
            return "Por favor, especifique uma categoria (eletronicos, roupas, calcados, acessorios)."
        
        encontrados = []
        for id_produto, produto in self.produtos.items():
            if categoria.lower() in produto['categoria'].lower():
                encontrados.append(f"ID: {id_produto} - {produto['nome']} - R$ {produto['preco']:.2f}")
        
        if encontrados:
            return f"** Produtos da categoria '{categoria}': **\n" + "\n".join(encontrados)
        else:
            return f"Nenhum produto encontrado na categoria '{categoria}'"
    
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
            "como voce funciona": "Sou um assistente de IA criado para ajudar com compras online. Uso processamento de linguagem natural para entender suas necessidades.",
            "quem e voce": "Sou seu assistente virtual de e-commerce! Posso ajudar com produtos, carrinho, precos e responder suas duvidas.",
            "que horas sao": f"Agora sao {datetime.now().strftime('%H:%M')} do dia {datetime.now().strftime('%d/%m/%Y')}.",
            "que dia e hoje": f"Hoje e {datetime.now().strftime('%d/%m/%Y')}, {self.dia_semana()}.",
            "qual seu nome": "Sou o Assistente Virtual da Loja! Pode me chamar de IA Shopping.",
            "voce e humano": "Nao, sou uma inteligencia artificial criada para tornar sua experiencia de compra mais facil!",
            "como posso pagar": "Aceitamos cartao de credito, debito, PIX e boleto bancario. O pagamento e processado de forma segura.",
            "entrega": "Fazemos entregas em todo o Brasil! O prazo varia de 1 a 7 dias uteis dependendo da sua localizacao.",
            "devolucao": "Voce tem 30 dias para devolver produtos. Entre em contato conosco para iniciar o processo.",
            "garantia": "Todos os produtos tem garantia do fabricante. Eletronicos: 1 ano, roupas e calcados: 90 dias.",
            "desconto": "Temos promocoes especiais! Cadastre-se na newsletter para receber ofertas exclusivas.",
            "obrigado": "De nada! Fico feliz em ajudar. Ha mais alguma coisa que posso fazer por voce?",
            "tchau": "Ate logo! Volte sempre que precisar. Tenha um otimo dia!",
            "problema": "Sinto muito pelo inconveniente. Pode me contar qual problema esta enfrentando?"
        }
        
        # Busca por palavras-chave na mensagem
        for palavra_chave, resposta in respostas.items():
            if palavra_chave in mensagem.lower().replace('ê', 'e').replace('ã', 'a').replace('ç', 'c'):
                return resposta
        
        # Respostas baseadas em contexto
        if "por que" in mensagem or "porque" in mensagem:
            return "Essa e uma boa pergunta! Como assistente de e-commerce, foco em ajudar com compras."
        
        if "como" in mensagem:
            return "Posso explicar como usar nossa loja: navegue pelos produtos, adicione ao carrinho e finalize a compra."
        
        if "onde" in mensagem:
            return "Nossa loja e virtual! Voce pode acessar de qualquer lugar. Para entregas, atendemos todo o Brasil."
        
        if "quando" in mensagem:
            return "Os prazos variam: entrega de 1-7 dias, atendimento 24h online, promocoes semanais."
        
        if any(palavra in mensagem for palavra in ["legal", "bom", "gostei", "perfeito", "excelente"]):
            return "Que bom que gostou! Estou aqui para tornar sua experiencia ainda melhor."
        
        # Resposta padrao inteligente
        return f"Interessante pergunta sobre '{mensagem}'! Como assistente de e-commerce, posso ajudar com:\n\n- Ver produtos digitando 'produtos'\n- Buscar itens especificos\n- Informacoes sobre entrega e pagamento\n\nComo posso ajudar melhor?"
    
    def dia_semana(self):
        dias = ['segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sabado', 'domingo']
        return dias[datetime.now().weekday()]

# Interface de chat simples
def main():
    agente = AgenteEcommerce()
    print("Agente E-commerce iniciado! Digite 'sair' para encerrar.\n")
    
    while True:
        mensagem = input("Voce: ")
        if mensagem.lower() in ['sair', 'quit', 'exit']:
            print("Obrigado por usar nosso assistente! Ate logo!")
            break
        
        resposta = agente.processar_mensagem(mensagem)
        print(f"Assistente: {resposta}\n")

if __name__ == "__main__":
    main()