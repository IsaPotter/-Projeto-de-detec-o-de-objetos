from functools import wraps
from flask import request, jsonify, session
import hashlib
import time
import re

class SecurityManager:
    def __init__(self):
        self.failed_attempts = {}
        self.blocked_ips = {}
        
    def rate_limit(self, max_requests=10, window=60):
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                ip = request.remote_addr
                current_time = time.time()
                
                if ip not in self.failed_attempts:
                    self.failed_attempts[ip] = []
                
                # Remove tentativas antigas
                self.failed_attempts[ip] = [
                    t for t in self.failed_attempts[ip] 
                    if current_time - t < window
                ]
                
                # Verificar limite
                if len(self.failed_attempts[ip]) >= max_requests:
                    return jsonify({'error': 'Muitas tentativas. Tente novamente em 1 minuto.'}), 429
                
                self.failed_attempts[ip].append(current_time)
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def validate_input(self, data):
        """Validar e sanitizar dados de entrada"""
        if isinstance(data, str):
            # Remover caracteres perigosos
            data = re.sub(r'[<>"\']', '', data)
            data = data.strip()
        return data
    
    def check_sql_injection(self, text):
        """Detectar tentativas de SQL injection"""
        dangerous_patterns = [
            r'union\s+select', r'drop\s+table', r'delete\s+from',
            r'insert\s+into', r'update\s+set', r'exec\s*\(',
            r'script\s*>', r'javascript:', r'vbscript:'
        ]
        
        text_lower = text.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, text_lower):
                return True
        return False
    
    def generate_csrf_token(self):
        """Gerar token CSRF"""
        token = hashlib.sha256(f"{time.time()}{session.get('user_id', '')}".encode()).hexdigest()
        session['csrf_token'] = token
        return token
    
    def validate_csrf_token(self, token):
        """Validar token CSRF"""
        return session.get('csrf_token') == token