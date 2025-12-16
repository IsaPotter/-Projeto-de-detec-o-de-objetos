# Agente de IA Assistente E-commerce

Um assistente virtual inteligente para e-commerce que ajuda clientes com consultas de produtos, carrinho de compras e suporte.

## Funcionalidades

- 🛍️ **Catálogo de Produtos**: Visualizar todos os produtos disponíveis
- 🔍 **Busca Inteligente**: Encontrar produtos por nome ou categoria
- 🛒 **Carrinho de Compras**: Adicionar produtos e ver total
- 💰 **Consulta de Preços**: Verificar preços de produtos específicos
- 📦 **Verificação de Estoque**: Consultar disponibilidade

## Como Usar

### Modo Terminal
```bash
python agente_ecommerce.py
```

### Interface Web
```bash
pip install -r requirements.txt
python web_interface.py
```
Acesse: http://localhost:5000

## Comandos Disponíveis

- "produtos" ou "catálogo" - Lista todos os produtos
- "buscar [termo]" - Busca produtos
- "adicionar [id] carrinho" - Adiciona produto ao carrinho
- "carrinho" - Mostra itens no carrinho
- "preço [id]" - Consulta preço do produto
- "estoque [id]" - Verifica estoque

## Exemplo de Uso

```
Você: produtos
Assistente: 📦 Produtos Disponíveis:
ID: 1 - Smartphone - R$ 899.99 (eletrônicos)
ID: 2 - Notebook - R$ 2499.99 (eletrônicos)

Você: adicionar 1 carrinho
Assistente: ✅ Smartphone adicionado ao carrinho!
```