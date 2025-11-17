from flask import Blueprint, request, jsonify
from config_py.database import get_db_connection

users_bp = Blueprint('users', __name__)

def get_user_role(cursor, university_id):
    """Helper function to determine user role"""
    cursor.execute('SELECT * FROM [Admin] WHERE University_ID = ?', university_id)
    if cursor.fetchone():
        return 'admin'

    cursor.execute('SELECT * FROM [Tutor] WHERE University_ID = ?', university_id)
    if cursor.fetchone():
        return 'tutor'

    return 'student'

@users_bp.route('/', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM [Users] ORDER BY University_ID')
        users = cursor.fetchall()

        result = []
        for user in users:
            role = get_user_role(cursor, user.University_ID)
            result.append({
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
                'role': role,
            })

        conn.close()
        return jsonify(result)

    except Exception as e:
        print(f'Get users error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to fetch users'
        }), 500

@users_bp.route('/<int:id>', methods=['GET'])
def get_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM [Users] WHERE University_ID = ?', id)
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        role = get_user_role(cursor, id)
        conn.close()

        return jsonify({
            'University_ID': user.University_ID,
            'First_Name': user.First_Name,
            'Last_Name': user.Last_Name,
            'Email': user.Email,
            'Phone_Number': user.Phone_Number,
            'Address': user.Address,
            'National_ID': user.National_ID,
            'role': role,
        })

    except Exception as e:
        print(f'Get user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to fetch user'
        }), 500

@users_bp.route('/role/<string:role>', methods=['GET'])
def get_users_by_role(role):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if role == 'admin':
            query = """
                SELECT u.* FROM [Users] u
                INNER JOIN [Admin] a ON u.University_ID = a.University_ID
            """
        elif role == 'tutor':
            query = """
                SELECT u.* FROM [Users] u
                INNER JOIN [Tutor] t ON u.University_ID = t.University_ID
            """
        elif role == 'student':
            query = """
                SELECT u.* FROM [Users] u
                INNER JOIN [Student] s ON u.University_ID = s.University_ID
            """
        else:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Invalid role'
            }), 400

        cursor.execute(query)
        users = cursor.fetchall()

        result = []
        for user in users:
            result.append({
                'University_ID': user.University_ID,
                'First_Name': user.First_Name,
                'Last_Name': user.Last_Name,
                'Email': user.Email,
                'Phone_Number': user.Phone_Number,
                'Address': user.Address,
                'National_ID': user.National_ID,
                'role': role,
            })

        conn.close()
        return jsonify(result)

    except Exception as e:
        print(f'Get users by role error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to fetch users'
        }), 500

@users_bp.route('/', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO [Users] (University_ID, First_Name, Last_Name, Email, Phone_Number, [Address], National_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            data['University_ID'],
            data['First_Name'],
            data['Last_Name'],
            data['Email'],
            data['Phone_Number'],
            data['Address'],
            data['National_ID']
        )

        conn.commit()
        role = get_user_role(cursor, data['University_ID'])
        conn.close()

        return jsonify({
            **data,
            'role': role,
        }), 201

    except Exception as e:
        print(f'Create user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to create user'
        }), 500

@users_bp.route('/<int:id>', methods=['PUT'])
def update_user(id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE [Users]
            SET First_Name = ?,
                Last_Name = ?,
                Email = ?,
                Phone_Number = ?,
                [Address] = ?,
                National_ID = ?
            WHERE University_ID = ?
        """,
            data['First_Name'],
            data['Last_Name'],
            data['Email'],
            data['Phone_Number'],
            data['Address'],
            data['National_ID'],
            id
        )

        conn.commit()

        cursor.execute('SELECT * FROM [Users] WHERE University_ID = ?', id)
        user = cursor.fetchone()

        role = get_user_role(cursor, id)
        conn.close()

        return jsonify({
            'University_ID': user.University_ID,
            'First_Name': user.First_Name,
            'Last_Name': user.Last_Name,
            'Email': user.Email,
            'Phone_Number': user.Phone_Number,
            'Address': user.Address,
            'National_ID': user.National_ID,
            'role': role,
        })

    except Exception as e:
        print(f'Update user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to update user'
        }), 500

@users_bp.route('/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('DELETE FROM [Users] WHERE University_ID = ?', id)
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'User deleted successfully'})

    except Exception as e:
        print(f'Delete user error: {e}')
        return jsonify({
            'success': False,
            'error': 'Failed to delete user'
        }), 500
