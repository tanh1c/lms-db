from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from utils.jwt_utils import require_auth

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/user/<int:user_id>', methods=['GET'])
@require_auth
def get_user_quizzes(user_id):
    """Get all quizzes for a student from all sections"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentAllQuizzes %s', (user_id,))
        results = cursor.fetchall()
        conn.close()
        
        quizzes = []
        for row in results:
            quizzes.append({
                'QuizID': int(row[0]) if row[0] else None,
                'Section_ID': row[1],
                'Course_ID': row[2],
                'Semester': row[3],
                'Assessment_ID': int(row[4]) if row[4] else None,
                'Grading_method': row[5],
                'pass_score': float(row[6]) if row[6] else None,
                'Time_limits': str(row[7]) if row[7] else None,
                'Start_Date': str(row[8]) if row[8] else None,
                'End_Date': str(row[9]) if row[9] else None,
                'content': row[10],
                'types': row[11],
                'Weight': float(row[12]) if row[12] else None,
                'Correct_answer': row[13],
                'Questions': row[14],
                'Responses': row[15],
                'completion_status': row[16],
                'score': float(row[17]) if row[17] is not None else None,
                'Course_Name': row[18],
                'status_display': row[19]
            })
        
        return jsonify(quizzes)
    except Exception as e:
        print(f'Get user quizzes error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get quizzes: {str(e)}'}), 500

@quizzes_bp.route('/<int:id>', methods=['GET'])
@require_auth
def get_quiz(id):
    """Get quiz details by QuizID or Assessment_ID"""
    try:
        university_id = request.args.get('university_id', type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetQuizById %s, %s', (id, university_id))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Quiz not found'}), 404
        
        # Parse result: QuizID, Section_ID, Course_ID, Semester, Assessment_ID, Grading_method, 
        # pass_score, Time_limits, Start_Date, End_Date, content, types, Weight, Correct_answer, 
        # Questions, Responses, completion_status, score, status_display
        quiz = {
            'QuizID': int(result[0]) if result[0] else None,
            'Section_ID': result[1],
            'Course_ID': result[2],
            'Semester': result[3],
            'Assessment_ID': int(result[4]) if result[4] else None,
            'Grading_method': result[5],
            'pass_score': float(result[6]) if result[6] else None,
            'Time_limits': str(result[7]) if result[7] else None,
            'Start_Date': str(result[8]) if result[8] else None,
            'End_Date': str(result[9]) if result[9] else None,
            'content': result[10],
            'types': result[11],
            'Weight': float(result[12]) if result[12] else None,
            'Correct_answer': result[13],
            'Questions': result[14],
            'Responses': result[15] if len(result) > 15 else None,
            'completion_status': result[16] if len(result) > 16 else None,
            'score': float(result[17]) if len(result) > 17 and result[17] else None,
            'status_display': result[18] if len(result) > 18 else None,
        }
        
        return jsonify(quiz)
    except Exception as e:
        print(f'Get quiz error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get quiz: {str(e)}'}), 500
