"""
JWT Token Utilities
Handles JWT token generation, verification, and refresh
"""
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv('JWT_SECRET', '')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRES_IN = os.getenv('JWT_EXPIRES_IN', '24h')  # Default 24 hours
JWT_REMEMBER_ME_EXPIRES_IN = '30d'  # 30 days for remember me

def parse_expires_in(expires_str: str) -> timedelta:
    """Parse expires_in string to timedelta"""
    if expires_str.endswith('h'):
        hours = int(expires_str[:-1])
        return timedelta(hours=hours)
    elif expires_str.endswith('d'):
        days = int(expires_str[:-1])
        return timedelta(days=days)
    elif expires_str.endswith('m'):
        minutes = int(expires_str[:-1])
        return timedelta(minutes=minutes)
    else:
        # Default to 24 hours
        return timedelta(hours=24)

def generate_token(user_id: int, role: str, remember_me: bool = False) -> str:
    """
    Generate JWT token for user
    
    Args:
        user_id: University_ID of the user
        role: User role (student, tutor, admin)
        remember_me: If True, use longer expiration (30 days), else use default
    
    Returns:
        JWT token string
    """
    expires_in = parse_expires_in(JWT_REMEMBER_ME_EXPIRES_IN if remember_me else JWT_EXPIRES_IN)
    expiration = datetime.utcnow() + expires_in
    
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': expiration,
        'iat': datetime.utcnow(),
        'remember_me': remember_me
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and return payload
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_token_from_request() -> Optional[str]:
    """
    Extract JWT token from request headers
    
    Returns:
        Token string if found, None otherwise
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def require_auth(f):
    """
    Decorator to require JWT authentication for a route
    
    Usage:
        @auth_bp.route('/protected')
        @require_auth
        def protected_route():
            user_id = request.current_user_id
            role = request.current_user_role
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Authentication required'
            }), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token'
            }), 401
        
        # Attach user info to request
        request.current_user_id = payload.get('user_id')
        request.current_user_role = payload.get('role')
        request.current_user_remember_me = payload.get('remember_me', False)
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(allowed_roles: list):
    """
    Decorator to require specific role(s) for a route
    
    Usage:
        @auth_bp.route('/admin-only')
        @require_auth
        @require_role(['admin'])
        def admin_route():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user_role'):
                return jsonify({
                    'success': False,
                    'error': 'Authentication required'
                }), 401
            
            if request.current_user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'error': 'Insufficient permissions'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

