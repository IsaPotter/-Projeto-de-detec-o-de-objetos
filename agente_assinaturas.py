import json
import re
from datetime import datetime, timedelta

class AgenteAssinaturasIA:
    def __init__(self):
        self.planos = {
            "1": {"nome": "WhatsApp Básico", "preco": 39.90, "tipo": "mensal", "recursos": ["Bot WhatsApp", "50 planilhas/mês", "Modelos básicos", "Suporte email"]},
            "2": {"nome": "WhatsApp Pro", "preco": 89.90, "tipo": "mensal", "recursos": ["Bot avançado", "500 planilhas/mês", "Todos os modelos", "Relatórios automáticos", "Suporte prioritário"]},
            "3": {"nome": "WhatsApp Enterprise", "preco": 199.90, "tipo": "mensal", "recursos": ["Bot personalizado", "Planilhas ilimitadas", "Integração API", "Dashboard completo", "Suporte 24/7"]},
            "4": {"nome": "WhatsApp Básico Anual", "preco": 399.90, "tipo": "anual", "recursos": ["Bot WhatsApp", "50 planilhas/mês", "Modelos básicos", "2 meses grátis"]},
            "5": {"nome": "WhatsApp Pro Anual", "preco": 899.90, "tipo": "anual", "recursos": ["Bot avançado", "500 planilhas/mês", "Todos os modelos", "Relatórios", "2 meses grátis"]},
            "6": {"nome": "WhatsApp Enterprise Anual", "preco": 1999.90, "tipo": "anual", "recursos": ["Bot personalizado", "Planilhas ilimitadas", "Integração completa", "2 meses grátis"]}
        }
        self.assinaturas_ativas = {}
        self.historico_pagamentos = []
        
    def processar_mensagem(self, mensagem):
        mensagem = mensagem.lower().strip()
        
        if any(palavra in mensagem for palavra in ["ola", "oi", "bom dia", "boa tarde"]):
            return "🤖 Olá! Bem-vindo à nossa plataforma de IA! Oferecemos soluções de inteligência artificial personalizadas.\n\nPosso ajudar com:\n• Ver planos de assinatura\n• Contratar serviços de IA\n• Gerenciar assinaturas\n• Informações sobre nossa tecnologia\n\nO que gostaria de saber?"
            
        elif "planos" in mensagem or "assinatura" in mensagem or "precos" in mensagem:
            return self.listar_planos()
            
        elif "contratar" in mensagem or "assinar" in mensagem:
            plano_id = self.extrair_id_plano(mensagem)
            return self.contratar_plano(plano_id)
            
        elif "minhas assinaturas" in mensagem or "meus planos" in mensagem:
            return self.ver_assinaturas()
            
        elif "cancelar" in mensagem:
            plano_id = self.extrair_id_plano(mensagem)
            return self.cancelar_assinatura(plano_id)
            
        elif "ia" in mensagem and ("como" in mensagem or "funciona" in mensagem):
            return self.explicar_ia()
            
        elif "api" in mensagem:
            return self.info_api()
            
        elif "suporte" in mensagem or "ajuda" in mensagem:
            return self.info_suporte()
            
        elif "pagamento" in mensagem:
            return self.info_pagamento()
            
        else:
            return self.resposta_geral(mensagem)
    
    def listar_planos(self):
        resultado = "💎 **PLANOS DE IA DISPONÍVEIS**\n\n"
        
        resultado += "📅 **PLANOS MENSAIS:**\n"
        for id_plano, plano in self.planos.items():
            if plano['tipo'] == 'mensal':
                resultado += f"ID: {id_plano} - {plano['nome']} - R$ {plano['preco']:.2f}/mês\n"
                resultado += f"   Recursos: {', '.join(plano['recursos'])}\n\n"
        
        resultado += "🎯 **PLANOS ANUAIS (Economia de 2 meses):**\n"
        for id_plano, plano in self.planos.items():
            if plano['tipo'] == 'anual':
                resultado += f"ID: {id_plano} - {plano['nome']} - R$ {plano['preco']:.2f}/ano\n"
                resultado += f"   Recursos: {', '.join(plano['recursos'])}\n\n"
        
        resultado += "💡 Digite 'contratar [ID]' para assinar um plano!"
        return resultado
    
    def contratar_plano(self, plano_id):
        if not plano_id or plano_id not in self.planos:
            return "❌ Por favor, especifique um ID de plano válido. Digite 'planos' para ver as opções."
        
        plano = self.planos[plano_id]
        
        # Simula contratação
        data_inicio = datetime.now()
        if plano['tipo'] == 'mensal':
            data_fim = data_inicio + timedelta(days=30)
        else:
            data_fim = data_inicio + timedelta(days=365)
        
        self.assinaturas_ativas[plano_id] = {
            'plano': plano,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'status': 'ativa'
        }
        
        # Registra pagamento
        self.historico_pagamentos.append({
            'plano_id': plano_id,
            'valor': plano['preco'],
            'data': data_inicio,
            'tipo': 'contratacao'
        })
        
        return f"✅ **ASSINATURA CONTRATADA COM SUCESSO!**\n\n📋 Plano: {plano['nome']}\n💰 Valor: R$ {plano['preco']:.2f}\n📅 Válido até: {data_fim.strftime('%d/%m/%Y')}\n\n🚀 Sua IA já está ativa! Acesse o painel para começar a usar."
    
    def ver_assinaturas(self):
        if not self.assinaturas_ativas:
            return "📋 Você não possui assinaturas ativas.\n\n💡 Digite 'planos' para ver nossas opções de IA!"
        
        resultado = "📋 **SUAS ASSINATURAS ATIVAS**\n\n"
        for plano_id, assinatura in self.assinaturas_ativas.items():
            plano = assinatura['plano']
            resultado += f"🤖 {plano['nome']}\n"
            resultado += f"💰 R$ {plano['preco']:.2f}/{plano['tipo']}\n"
            resultado += f"📅 Válido até: {assinatura['data_fim'].strftime('%d/%m/%Y')}\n"
            resultado += f"🔧 Recursos: {', '.join(plano['recursos'])}\n\n"
        
        return resultado
    
    def cancelar_assinatura(self, plano_id):
        if not plano_id or plano_id not in self.assinaturas_ativas:
            return "❌ Assinatura não encontrada. Digite 'minhas assinaturas' para ver seus planos ativos."
        
        plano_nome = self.assinaturas_ativas[plano_id]['plano']['nome']
        del self.assinaturas_ativas[plano_id]
        
        return f"✅ Assinatura '{plano_nome}' cancelada com sucesso.\n\n📧 Você receberá um email de confirmação em breve."
    
    def explicar_ia(self):
        return "🧠 **NOSSA TECNOLOGIA DE IA**\n\nOferecemos soluções de inteligência artificial de última geração:\n\n🔹 **Processamento de Linguagem Natural** - Compreende e responde em português\n🔹 **Machine Learning Avançado** - Aprende com suas interações\n🔹 **API Robusta** - Integração fácil com seus sistemas\n🔹 **Personalização Total** - IA treinada para seu negócio\n🔹 **Escalabilidade** - Cresce conforme sua demanda\n\n💡 Transforme seu negócio com IA inteligente!"
    
    def info_api(self):
        return "🔌 **API DE IA**\n\nNossa API permite integrar IA em qualquer sistema:\n\n📋 **Recursos:**\n• Endpoints REST simples\n• Documentação completa\n• SDKs para Python, JavaScript, PHP\n• Autenticação segura\n• Rate limiting configurável\n\n🚀 **Casos de uso:**\n• Chatbots inteligentes\n• Análise de sentimentos\n• Classificação de textos\n• Geração de conteúdo\n\n💎 Disponível nos planos Pro e Enterprise!"
    
    def info_suporte(self):
        return "🎧 **SUPORTE TÉCNICO**\n\n📧 **Email:** suporte@ia-platform.com\n💬 **Chat:** Disponível no painel\n📞 **Telefone:** (11) 9999-9999\n\n⏰ **Horários:**\n• Básico: Seg-Sex 9h-18h\n• Pro: Seg-Sex 8h-20h\n• Enterprise: 24/7\n\n📚 **Recursos:**\n• Base de conhecimento\n• Tutoriais em vídeo\n• Documentação técnica\n• Comunidade de desenvolvedores"
    
    def info_pagamento(self):
        return "💳 **FORMAS DE PAGAMENTO**\n\n✅ **Aceitos:**\n• Cartão de crédito (Visa, Master, Elo)\n• PIX (desconto de 5%)\n• Boleto bancário\n• Transferência bancária\n\n🔒 **Segurança:**\n• Criptografia SSL\n• PCI DSS Compliance\n• Dados protegidos\n\n📅 **Cobrança:**\n• Mensais: Todo dia 15\n• Anuais: Data da contratação\n• Renovação automática"
    
    def resposta_geral(self, mensagem):
        respostas = {
            "preco": "Nossos planos começam em R$ 29,90/mês. Digite 'planos' para ver todas as opções!",
            "gratis": "Oferecemos trial gratuito de 7 dias em todos os planos. Experimente nossa IA sem compromisso!",
            "empresa": "Somos uma startup brasileira especializada em soluções de IA para empresas de todos os tamanhos.",
            "seguranca": "Levamos segurança a sério: dados criptografados, servidores no Brasil, compliance LGPD.",
            "integracao": "Nossa IA se integra facilmente via API REST. Temos SDKs e documentação completa.",
            "personalizar": "Sim! Nos planos Pro e Enterprise oferecemos treinamento personalizado da IA."
        }
        
        for palavra_chave, resposta in respostas.items():
            if palavra_chave in mensagem:
                return resposta
        
        return f"🤔 Interessante pergunta sobre '{mensagem}'!\n\nComo plataforma de IA, posso ajudar com:\n• Informações sobre nossos planos\n• Detalhes técnicos da nossa IA\n• Suporte e integração\n• Contratação de serviços\n\nO que gostaria de saber especificamente?"
    
    def extrair_id_plano(self, mensagem):
        numeros = re.findall(r'\d+', mensagem)
        return numeros[0] if numeros else None

def main():
    agente = AgenteAssinaturasIA()
    print("Plataforma de IA iniciada! Digite 'sair' para encerrar.\n")
    
    while True:
        mensagem = input("Você: ")
        if mensagem.lower() in ['sair', 'quit', 'exit']:
            print("Obrigado por conhecer nossa plataforma de IA! Ate logo!")
            break
        
        resposta = agente.processar_mensagem(mensagem)
        print(f"IA Assistant: {resposta}\n")

if __name__ == "__main__":
    main()