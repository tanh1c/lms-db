from flask import Blueprint, jsonify
from config_py.database import get_db_connection

students_bp = Blueprint('students', __name__)

@students_bp.route('/course/<string:course_id>', methods=['GET'])
def get_students_by_course(course_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT u.*, s.GPA, s.Year as Student_Year
            FROM [Student] s
            INNER JOIN [Users] u ON s.University_ID = u.University_ID
            INNER JOIN [Enrollment] e ON s.University_ID = e.University_ID
            INNER JOIN [Section] sec ON e.Section_ID = sec.Section_ID
            WHERE sec.Course_ID = ?
        """, course_id)

        students = cursor.fetchall()
        conn.close()

        result = []
        for student in students:
            result.append({
                'University_ID': student.University_ID,
                'First_Name': student.First_Name,
                'Last_Name': student.Last_Name,
                'Email': student.Email,
                'GPA': float(student.GPA) if student.GPA else None,
                'Year': student.Student_Year,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get students by course error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch students'}), 500
