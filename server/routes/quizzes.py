from flask import Blueprint, jsonify

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_quizzes(user_id):
    return jsonify({'message': 'Quizzes endpoint - to be implemented', 'user_id': user_id})

@quizzes_bp.route('/<int:id>', methods=['GET'])
def get_quiz(id):
    return jsonify({'message': 'Quiz detail endpoint - to be implemented', 'id': id})
