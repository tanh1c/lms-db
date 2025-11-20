from flask import Blueprint, request, jsonify
from config.database import get_db_connection
import bcrypt
from utils.jwt_utils import generate_token, verify_token, require_auth, get_token_from_request

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        university_id = data.get('universityId')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)  # Remember Me option

        if not university_id or not password:
            return jsonify({
                'success': False,
                'error': 'University ID and password are required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            user_id = int(university_id)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Mã số không hợp lệ'
            }), 400

        # Get user and account info
        cursor.execute("""
            SELECT u.University_ID, u.First_Name, u.Last_Name, u.Email, 
                   u.Phone_Number, u.[Address], u.National_ID, a.[Password] as PasswordHash
            FROM [Users] u
            LEFT JOIN [Account] a ON u.University_ID = a.University_ID
            WHERE u.University_ID = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Người dùng không tồn tại'
            }), 404

        # Check password
        password_hash = user.PasswordHash if hasattr(user, 'PasswordHash') else (user[7] if len(user) > 7 else None)
        if password_hash:
            stored_password = password_hash.strip() if password_hash else None
            
            # Check if password is bcrypt hash (starts with $2a$, $2b$, or $2y$)
            is_bcrypt_hash = stored_password and (
                stored_password.startswith('$2a$') or 
                stored_password.startswith('$2b$') or 
                stored_password.startswith('$2y$')
            )
            
            password_valid = False
            
            if is_bcrypt_hash:
                # Try bcrypt verification
                try:
                    password_valid = bcrypt.checkpw(
                        password.encode('utf-8'), 
                        stored_password.encode('utf-8')
                    )
                except Exception as e:
                    print(f'Bcrypt check error: {e}')
                    password_valid = False
            else:
                # Plain text comparison (for backward compatibility)
                password_valid = (stored_password == password)
            
            if not password_valid:
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'Mật khẩu không đúng'
                }), 401

        # Determine user role
        role = 'student'

        # Check if admin
        cursor.execute('SELECT * FROM [Admin] WHERE University_ID = %s', (user_id,))
        if cursor.fetchone():
            role = 'admin'
        else:
            # Check if tutor
            cursor.execute('SELECT * FROM [Tutor] WHERE University_ID = %s', (user_id,))
            if cursor.fetchone():
                role = 'tutor'

        conn.close()

        # Extract user data (handle both tuple and object)
        if hasattr(user, 'University_ID'):
            user_data = {
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
            }
        else:
            # Tuple access: University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID, PasswordHash
            user_data = {
                'University_ID': user[0],
                'First_Name': user[1],
                'Last_Name': user[2],
                'Email': user[3],
                'Phone_Number': user[4],
                'Address': user[5],
                'National_ID': user[6],
            }
        
        # Generate JWT token
        token = generate_token(user_id, role, remember_me)
        
        return jsonify({
            'success': True,
            'user': {
                **user_data,
                'role': role,
            },
            'role': role,
            'token': token,
            'rememberMe': remember_me,
        })

    except Exception as e:
        print(f'Login error: {e}')
        return jsonify({
            'success': False,
            'error': 'Đã xảy ra lỗi khi đăng nhập'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    # Token is already verified by require_auth
    # Frontend will clear the token from storage
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/verify', methods=['GET'])
def verify():
    """Verify JWT token validity"""
    token = get_token_from_request()
    
    if not token:
        return jsonify({
            'success': False,
            'valid': False,
            'error': 'No token provided'
        }), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({
            'success': False,
            'valid': False,
            'error': 'Invalid or expired token'
        }), 401
    
    return jsonify({
        'success': True,
        'valid': True,
        'user_id': payload.get('user_id'),
        'role': payload.get('role'),
        'remember_me': payload.get('remember_me', False)
    })

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh JWT token"""
    token = get_token_from_request()
    
    if not token:
        return jsonify({
            'success': False,
            'error': 'No token provided'
        }), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Invalid or expired token'
        }), 401
    
    # Generate new token with same parameters
    new_token = generate_token(
        payload.get('user_id'),
        payload.get('role'),
        payload.get('remember_me', False)
    )
    
    return jsonify({
        'success': True,
        'token': new_token
    })

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    try:
        # Get user_id from JWT token
        user_id = request.current_user_id

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM [Users] WHERE University_ID = %s', (user_id,))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Determine role
        role = 'student'
        cursor.execute('SELECT * FROM [Admin] WHERE University_ID = %s', (user_id,))
        if cursor.fetchone():
            role = 'admin'
        else:
            cursor.execute('SELECT * FROM [Tutor] WHERE University_ID = %s', (user_id,))
            if cursor.fetchone():
                role = 'tutor'

        conn.close()

        # Extract user data (handle both tuple and object)
        if hasattr(user, 'University_ID'):
            user_data = {
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
            }
        else:
            # Tuple access
            user_data = {
                'University_ID': user[0],
                'First_Name': user[1],
                'Last_Name': user[2],
                'Email': user[3],
                'Phone_Number': user[4],
                'Address': user[5],
                'National_ID': user[6],
            }

        return jsonify({
            'success': True,
            'user': {
                **user_data,
                'role': role,
            },
        })

    except Exception as e:
        print(f'Get current user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to get user information'
        }), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset token"""
    try:
        data = request.get_json()
        university_id = data.get('universityId')
        email = data.get('email')  # Optional: verify email matches

        if not university_id:
            return jsonify({
                'success': False,
                'error': 'University ID is required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            user_id = int(university_id)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Mã số không hợp lệ'
            }), 400

        # Check if user exists
        cursor.execute("""
            SELECT u.University_ID, u.Email
            FROM [Users] u
            LEFT JOIN [Account] a ON u.University_ID = a.University_ID
            WHERE u.University_ID = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Người dùng không tồn tại'
            }), 404

        # Verify email if provided
        user_email = user.Email if hasattr(user, 'Email') else (user[1] if len(user) > 1 else None)
        if email and user_email and email.lower() != user_email.lower():
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Email không khớp với tài khoản'
            }), 400

        # Generate reset token (simple UUID-like string)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        
        # Set expiration (1 hour from now)
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(hours=1)

        # Store reset token in database
        cursor.execute("{CALL RequestPasswordReset}", (user_id, reset_token, expires_at))
        conn.commit()
        conn.close()

        # In production, send email with reset link
        # For now, return token (in production, don't return token, send via email)
        return jsonify({
            'success': True,
            'message': 'Password reset token generated',
            'token': reset_token,  # Remove this in production, send via email instead
            'expiresAt': expires_at.isoformat()
        })

    except Exception as e:
        print(f'Forgot password error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Đã xảy ra lỗi khi tạo reset token'
        }), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using reset token"""
    try:
        data = request.get_json()
        reset_token = data.get('token')
        new_password = data.get('newPassword')

        if not reset_token or not new_password:
            return jsonify({
                'success': False,
                'error': 'Token and new password are required'
            }), 400

        # Verify token
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("{CALL VerifyResetToken}", (reset_token,))
        result = cursor.fetchone()
        
        if not result or (hasattr(result, 'IsValid') and result.IsValid == 0):
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Token không hợp lệ hoặc đã hết hạn'
            }), 400

        university_id = result.University_ID if hasattr(result, 'University_ID') else result[0]

        # Hash new password
        import bcrypt
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password using stored procedure
        cursor.execute("{CALL ResetPasswordWithToken}", (reset_token, password_hash))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mật khẩu đã được đặt lại thành công'
        })

    except Exception as e:
        print(f'Reset password error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Đã xảy ra lỗi khi đặt lại mật khẩu'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change password for authenticated user"""
    try:
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not current_password or not new_password:
            return jsonify({
                'success': False,
                'error': 'Current password and new password are required'
            }), 400

        user_id = request.current_user_id

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get current password hash
        cursor.execute("""
            SELECT a.[Password] as PasswordHash
            FROM [Account] a
            WHERE a.University_ID = %s
        """, (user_id,))

        account = cursor.fetchone()

        if not account:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Tài khoản không tồn tại'
            }), 404

        password_hash = account.PasswordHash if hasattr(account, 'PasswordHash') else (account[0] if len(account) > 0 else None)
        
        if password_hash:
            stored_password = password_hash.strip() if password_hash else None
            
            # Check if password is bcrypt hash
            is_bcrypt_hash = stored_password and (
                stored_password.startswith('$2a$') or 
                stored_password.startswith('$2b$') or 
                stored_password.startswith('$2y$')
            )
            
            password_valid = False
            
            if is_bcrypt_hash:
                try:
                    password_valid = bcrypt.checkpw(
                        current_password.encode('utf-8'), 
                        stored_password.encode('utf-8')
                    )
                except Exception as e:
                    print(f'Bcrypt check error: {e}')
                    password_valid = False
            else:
                password_valid = (stored_password == current_password)
            
            if not password_valid:
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'Mật khẩu hiện tại không đúng'
                }), 401

        # Hash new password
        import bcrypt
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        cursor.execute("{CALL UpdatePassword}", (user_id, new_password_hash))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mật khẩu đã được thay đổi thành công'
        })

    except Exception as e:
        print(f'Change password error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Đã xảy ra lỗi khi thay đổi mật khẩu'
        }), 500
