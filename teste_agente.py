from agente_ecommerce import AgenteEcommerce

def testar_agente():
    agente = AgenteEcommerce()
    
    print("=== TESTE COMPLETO DO AGENTE E-COMMERCE ===\n")
    
    # Teste 1: Saudação
    print("1. Teste de saudação:")
    print(f"Resposta: {agente.processar_mensagem('Olá')}\n")
    
    # Teste 2: Listar produtos
    print("2. Catálogo completo:")
    print(f"Resposta: {agente.processar_mensagem('produtos')}\n")
    
    # Teste 3: Buscar por categoria
    print("3. Buscar eletrônicos:")
    print(f"Resposta: {agente.processar_mensagem('categoria eletrônicos')}\n")
    
    # Teste 4: Adicionar múltiplos produtos
    print("4. Adicionando produtos ao carrinho:")
    print(f"iPhone: {agente.processar_mensagem('adicionar 1 carrinho')}")
    print(f"Fone: {agente.processar_mensagem('adicionar 5 carrinho')}")
    print(f"Smartwatch: {agente.processar_mensagem('adicionar 6 carrinho')}\n")
    
    # Teste 5: Ver carrinho completo
    print("5. Carrinho com múltiplos itens:")
    print(f"Resposta: {agente.processar_mensagem('carrinho')}\n")
    
    # Teste 6: Finalizar compra
    print("6. Finalizando compra:")
    print(f"Resposta: {agente.processar_mensagem('finalizar compra')}\n")
    
    # Teste 7: Verificar carrinho vazio
    print("7. Carrinho após compra:")
    print(f"Resposta: {agente.processar_mensagem('carrinho')}\n")

if __name__ == "__main__":
    testar_agente()