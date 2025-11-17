from flask import Blueprint, jsonify
from config.database import get_db_connection

schedule_bp = Blueprint('schedule', __name__)

@schedule_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_schedule(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get schedule based on enrollments
        cursor.execute("""
            SELECT
                s.Section_ID,
                c.Course_Name,
                c.Course_ID,
                s.Semester_ID,
                s.Year,
                r.Building_ID,
                r.Room_Number
            FROM [Enrollment] e
            INNER JOIN [Section] s ON e.Section_ID = s.Section_ID
            INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
            LEFT JOIN [Room] r ON s.Room_ID = r.Room_ID
            WHERE e.University_ID = ?
        """, user_id)

        schedule_items = cursor.fetchall()
        conn.close()

        result = []
        for item in schedule_items:
            result.append({
                'Section_ID': item.Section_ID,
                'Course_Name': item.Course_Name,
                'Course_ID': item.Course_ID,
                'Semester_ID': item.Semester_ID,
                'Year': item.Year,
                'Building_ID': item.Building_ID,
                'Room_Number': item.Room_Number,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get user schedule error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch schedule'}), 500
