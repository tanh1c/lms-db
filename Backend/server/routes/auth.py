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
            SELECT u.*, a.[Password] as PasswordHash
            FROM [Users] u
            LEFT JOIN [Account] a ON u.University_ID = a.University_ID
            WHERE u.University_ID = ?
        """, user_id)

        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Người dùng không tồn tại'
            }), 404

        # Check password
        if user.PasswordHash:
            if not bcrypt.checkpw(password.encode('utf-8'), user.PasswordHash.encode('utf-8')):
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'Mật khẩu không đúng'
                }), 401

        # Determine user role
        role = 'student'

        # Check if admin
        cursor.execute('SELECT * FROM [Admin] WHERE University_ID = ?', user_id)
        if cursor.fetchone():
            role = 'admin'
        else:
            # Check if tutor
            cursor.execute('SELECT * FROM [Tutor] WHERE University_ID = ?', user_id)
            if cursor.fetchone():
                role = 'tutor'

        conn.close()

        return jsonify({
            'success': True,
            'user': {
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
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

        cursor.execute('SELECT * FROM [Users] WHERE University_ID = ?', user_id)
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Determine role
        role = 'student'
        cursor.execute('SELECT * FROM [Admin] WHERE University_ID = ?', user_id)
        if cursor.fetchone():
            role = 'admin'
        else:
            cursor.execute('SELECT * FROM [Tutor] WHERE University_ID = ?', user_id)
            if cursor.fetchone():
                role = 'tutor'

        conn.close()

        return jsonify({
            'success': True,
            'user': {
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
                'role': role,
            },
        })

    except Exception as e:
        print(f'Get current user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to get user information'
        }), 500
