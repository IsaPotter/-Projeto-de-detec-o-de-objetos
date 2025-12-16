from functools import wraps
from flask import session, redirect, url_for, request, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': 'Login necessário'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    return session.get('user_id')

def login_user(user_id, nome, email):
    session['user_id'] = user_id
    session['nome'] = nome
    session['email'] = email

def logout_user():
    session.clear()