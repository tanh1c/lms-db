from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from utils.jwt_utils import require_auth, require_role

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

# ==================== STUDENT DASHBOARD ====================

@students_bp.route('/dashboard/statistics', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_dashboard_statistics():
    """Get student dashboard statistics"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentDashboardStatistics %s', (university_id,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({
                'total_courses': 0,
                'total_assignments': 0,
                'total_quizzes': 0,
                'completed_assignments': 0,
                'completed_quizzes': 0,
                'average_grade': 0.0,
                'total_study_hours': 0,
                'progress_percentage': 0.0,
                'leaderboard_rank': 0
            })
        
        return jsonify({
            'total_courses': int(result[0]) if result[0] else 0,
            'total_assignments': int(result[1]) if result[1] else 0,
            'total_quizzes': int(result[2]) if result[2] else 0,
            'completed_assignments': int(result[3]) if result[3] else 0,
            'completed_quizzes': int(result[4]) if result[4] else 0,
            'average_grade': float(result[5]) if result[5] else 0.0,
            'total_study_hours': int(result[6]) if result[6] else 0,
            'progress_percentage': float(result[7]) if result[7] else 0.0,
            'leaderboard_rank': int(result[8]) if result[8] else 0
        })
    except Exception as e:
        print(f'Get student dashboard statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get statistics: {str(e)}'}), 500

@students_bp.route('/dashboard/upcoming-tasks', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_upcoming_tasks():
    """Get student upcoming tasks (assignments and quizzes)"""
    try:
        university_id = request.args.get('university_id', type=int)
        days_ahead = request.args.get('days_ahead', default=7, type=int)
        
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentUpcomingTasks %s, %s', (university_id, days_ahead))
        results = cursor.fetchall()
        conn.close()
        
        tasks = []
        for row in results:
            tasks.append({
                'task_type': row[0],
                'task_id': row[1],
                'task_title': row[2],
                'deadline': str(row[3]) if row[3] else None,
                'course_name': row[4],
                'course_id': row[5],
                'semester': row[6],
                'is_completed': bool(row[7]),
                'current_status': row[8]
            })
        
        return jsonify(tasks)
    except Exception as e:
        print(f'Get student upcoming tasks error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get upcoming tasks: {str(e)}'}), 500

@students_bp.route('/dashboard/leaderboard', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_leaderboard():
    """Get student leaderboard"""
    try:
        top_n = request.args.get('top_n', default=10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentLeaderboard %s', (top_n,))
        results = cursor.fetchall()
        conn.close()
        
        leaderboard = []
        for row in results:
            leaderboard.append({
                'rank': int(row[0]),
                'first_name': row[1],
                'last_name': row[2],
                'course': int(row[3]) if row[3] else 0,
                'hour': int(row[4]) if row[4] else 0,
                'point': float(row[5]) if row[5] else 0.0,
                'trend': row[6]
            })
        
        return jsonify(leaderboard)
    except Exception as e:
        print(f'Get student leaderboard error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get leaderboard: {str(e)}'}), 500

@students_bp.route('/dashboard/activity-chart', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_activity_chart():
    """Get student activity chart data"""
    try:
        university_id = request.args.get('university_id', type=int)
        months_back = request.args.get('months_back', default=5, type=int)
        
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentActivityChart %s, %s', (university_id, months_back))
        results = cursor.fetchall()
        conn.close()
        
        chart_data = []
        for row in results:
            chart_data.append({
                'month': row[0],
                'Study': int(row[1]) if row[1] else 0,
                'Exams': int(row[2]) if row[2] else 0
            })
        
        return jsonify(chart_data)
    except Exception as e:
        print(f'Get student activity chart error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get activity chart: {str(e)}'}), 500

@students_bp.route('/dashboard/grade-components', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_grade_components():
    """Get student grade components by course"""
    try:
        university_id = request.args.get('university_id', type=int)
        
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentGradeComponents %s', (university_id,))
        results = cursor.fetchall()
        conn.close()
        
        grade_components = []
        for row in results:
            grade_components.append({
                'course_name': row[0],
                'course_id': row[1],
                'semester': row[2],
                'final_grade': float(row[3]) if row[3] else 0.0,
                'midterm_grade': float(row[4]) if row[4] else 0.0,
                'quiz_grade': float(row[5]) if row[5] else 0.0,
                'assignment_grade': float(row[6]) if row[6] else 0.0
            })
        
        return jsonify(grade_components)
    except Exception as e:
        print(f'Get student grade components error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get grade components: {str(e)}'}), 500

@students_bp.route('/dashboard/courses', methods=['GET'])
@require_auth
@require_role(['student'])
def get_student_courses():
    """Get courses that the student is enrolled in"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'University ID is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetStudentCourses %s', (university_id,))
        results = cursor.fetchall()
        conn.close()
        
        courses = []
        for row in results:
            courses.append({
                'Course_ID': row[0],
                'Name': row[1],
                'Credit': int(row[2]) if row[2] else None,
            })
        
        return jsonify(courses)
    except Exception as e:
        print(f'Get student courses error: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500
