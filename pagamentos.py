import random
import string
from datetime import datetime, timedelta

class ProcessadorPagamentos:
    def __init__(self):
        pass
    
    def processar_pix(self, valor, usuario_id):
        # Gerar código PIX
        codigo_pix = f"PIX{random.randint(100000, 999999)}"
        qr_code = f"00020126580014BR.GOV.BCB.PIX{codigo_pix}"
        
        return {
            'status': 'aprovado',
            'codigo': codigo_pix,
            'qr_code': qr_code,
            'valor_final': valor * 0.95,  # 5% desconto
            'vencimento': datetime.now() + timedelta(minutes=30),
            'instrucoes': 'Pague em até 30 minutos para garantir o desconto'
        }
    
    def processar_cartao(self, valor, dados_cartao):
        # Simular processamento do cartão
        numero = dados_cartao.get('numero', '').replace(' ', '')
        
        # Validação básica
        if len(numero) < 16:
            return {'status': 'recusado', 'erro': 'Número do cartão inválido'}
        
        # Simular aprovação (90% de chance)
        if random.random() < 0.9:
            transacao_id = f"TXN{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
            return {
                'status': 'aprovado',
                'transacao_id': transacao_id,
                'valor_final': valor,
                'autorizacao': f"AUTH{random.randint(100000, 999999)}",
                'bandeira': self.detectar_bandeira(numero)
            }
        else:
            return {'status': 'recusado', 'erro': 'Transação não autorizada pelo banco'}
    
    def processar_boleto(self, valor, usuario_id):
        # Gerar boleto
        codigo_barras = f"{''.join(random.choices(string.digits, k=47))}"
        linha_digitavel = f"{codigo_barras[:5]}.{codigo_barras[5:10]} {codigo_barras[10:15]}.{codigo_barras[15:21]} {codigo_barras[21:26]}.{codigo_barras[26:32]} {codigo_barras[32]} {codigo_barras[33:]}"
        
        return {
            'status': 'pendente',
            'codigo_barras': codigo_barras,
            'linha_digitavel': linha_digitavel,
            'valor_final': valor,
            'vencimento': datetime.now() + timedelta(days=3),
            'instrucoes': 'Pague em qualquer banco ou lotérica'
        }
    
    def processar_paypal(self, valor, email_usuario):
        # Simular PayPal
        paypal_id = f"PP{''.join(random.choices(string.ascii_uppercase + string.digits, k=10))}"
        
        return {
            'status': 'aprovado',
            'paypal_id': paypal_id,
            'valor_final': valor,
            'email': email_usuario,
            'url_redirect': f"https://paypal.com/checkout/{paypal_id}"
        }
    
    def detectar_bandeira(self, numero):
        if numero.startswith('4'):
            return 'Visa'
        elif numero.startswith(('5', '2')):
            return 'Mastercard'
        elif numero.startswith('3'):
            return 'American Express'
        else:
            return 'Desconhecida'