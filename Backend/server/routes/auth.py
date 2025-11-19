from flask import Blueprint, request, jsonify
from config.database import get_db_connection
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        university_id = data.get('universityId')
        password = data.get('password')

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
        
        return jsonify({
            'success': True,
            'user': {
                **user_data,
                'role': role,
            },
            'role': role,
        })

    except Exception as e:
        print(f'Login error: {e}')
        return jsonify({
            'success': False,
            'error': 'Đã xảy ra lỗi khi đăng nhập'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/me', methods=['GET'])
def get_me():
    try:
        university_id = request.args.get('universityId')

        if not university_id:
            return jsonify({
                'success': False,
                'error': 'University ID is required'
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        user_id = int(university_id)

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
