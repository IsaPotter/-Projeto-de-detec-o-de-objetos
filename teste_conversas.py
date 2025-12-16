from agente_ecommerce import AgenteEcommerce

def testar_conversas():
    agente = AgenteEcommerce()
    
    print("=== TESTE DE CONVERSAS GERAIS ===\n")
    
    perguntas = [
        "Olá, como você está?",
        "Quem é você?",
        "Como você funciona?",
        "Que horas são?",
        "Que dia é hoje?",
        "Qual seu nome?",
        "Você é humano?",
        "Como posso pagar?",
        "Como funciona a entrega?",
        "Posso devolver produtos?",
        "Tem garantia?",
        "Tem desconto?",
        "Por que devo comprar aqui?",
        "Como faço para comprar?",
        "Onde vocês ficam?",
        "Quando chegará meu pedido?",
        "Isso é muito legal!",
        "Obrigado pela ajuda",
        "Tchau",
        "Qual a capital do Brasil?"
    ]
    
    for i, pergunta in enumerate(perguntas, 1):
        print(f"{i}. Pergunta: {pergunta}")
        resposta = agente.processar_mensagem(pergunta)
        print(f"Resposta: {resposta}\n")

if __name__ == "__main__":
    testar_conversas()