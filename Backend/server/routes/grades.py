from flask import Blueprint, jsonify

grades_bp = Blueprint('grades', __name__)

@grades_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_grades(user_id):
    return jsonify({'message': 'Grades endpoint - to be implemented', 'user_id': user_id})
