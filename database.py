import sqlite3
import hashlib
from datetime import datetime, timedelta
import json

class Database:
    def __init__(self):
        self.conn = sqlite3.connect('plataforma_ia.db', check_same_thread=False)
        self.create_tables()
    
    def create_tables(self):
        cursor = self.conn.cursor()
        
        # Tabela de usuários
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN DEFAULT 1
            )
        ''')
        
        # Tabela de assinaturas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS assinaturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                plano_id TEXT NOT NULL,
                status TEXT DEFAULT 'ativa',
                data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_fim TIMESTAMP,
                valor REAL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            )
        ''')
        
        # Tabela de pagamentos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pagamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                assinatura_id INTEGER,
                valor REAL NOT NULL,
                metodo TEXT NOT NULL,
                status TEXT DEFAULT 'pendente',
                data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (assinatura_id) REFERENCES assinaturas (id)
            )
        ''')
        
        self.conn.commit()
    
    def criar_usuario(self, nome, email, senha):
        cursor = self.conn.cursor()
        
        # Verificar se email já existe
        cursor.execute('SELECT id FROM usuarios WHERE email = ?', (email,))
        if cursor.fetchone():
            return None
            
        # Criar hash da senha com salt
        import secrets
        salt = secrets.token_hex(16)
        senha_hash = hashlib.pbkdf2_hmac('sha256', senha.encode('utf-8'), salt.encode('utf-8'), 100000)
        senha_final = salt + senha_hash.hex()
        
        try:
            cursor.execute('''
                INSERT INTO usuarios (nome, email, senha)
                VALUES (?, ?, ?)
            ''', (nome, email, senha_final))
            self.conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError as e:
            print(f'Erro ao criar usuário: {e}')
            return None
        except Exception as e:
            print(f'Erro inesperado: {e}')
            return None
    
    def autenticar_usuario(self, email, senha):
        cursor = self.conn.cursor()
        
        cursor.execute('''
            SELECT id, nome, email, senha FROM usuarios
            WHERE email = ? AND ativo = 1
        ''', (email,))
        
        user = cursor.fetchone()
        if user:
            stored_password = user[3]
            salt = stored_password[:32]  # Primeiros 32 chars são o salt
            stored_hash = stored_password[32:]  # Resto é o hash
            
            # Verificar senha
            senha_hash = hashlib.pbkdf2_hmac('sha256', senha.encode('utf-8'), salt.encode('utf-8'), 100000)
            if senha_hash.hex() == stored_hash:
                return user[:3]  # Retorna apenas id, nome, email
        
        return None
    
    def criar_assinatura(self, usuario_id, plano_id, valor, duracao_dias=30):
        cursor = self.conn.cursor()
        data_fim = datetime.now() + timedelta(days=duracao_dias)
        
        cursor.execute('''
            INSERT INTO assinaturas (usuario_id, plano_id, valor, data_fim)
            VALUES (?, ?, ?, ?)
        ''', (usuario_id, plano_id, valor, data_fim))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def criar_pagamento(self, usuario_id, assinatura_id, valor, metodo):
        cursor = self.conn.cursor()
        
        try:
            # Status baseado no método de pagamento
            status = 'aprovado' if metodo in ['pix', 'cartao', 'paypal'] else 'pendente'
            
            cursor.execute('''
                INSERT INTO pagamentos (usuario_id, assinatura_id, valor, metodo, status)
                VALUES (?, ?, ?, ?, ?)
            ''', (usuario_id, assinatura_id, valor, metodo, status))
            
            self.conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f'Erro ao criar pagamento: {e}')
            return None
    
    def get_assinaturas_usuario(self, usuario_id):
        cursor = self.conn.cursor()
        
        cursor.execute('''
            SELECT * FROM assinaturas
            WHERE usuario_id = ? AND status = 'ativa'
        ''', (usuario_id,))
        
        return cursor.fetchall()
    
    def get_usuario_por_id(self, usuario_id):
        cursor = self.conn.cursor()
        
        cursor.execute('''
            SELECT id, nome, email FROM usuarios
            WHERE id = ?
        ''', (usuario_id,))
        
        return cursor.fetchone()