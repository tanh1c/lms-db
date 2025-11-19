from flask import Blueprint, jsonify
from config.database import get_db_connection

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/', methods=['GET'])
def get_courses():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM [Course]')
        courses = cursor.fetchall()
        conn.close()

        result = []
        for course in courses:
            # Tuple access: Course_ID, Name, Credit, Start_Date
            result.append({
                'Course_ID': course[0],
                'Course_Name': course[1],  # Name
                'Credits': course[2],      # Credit
                'Start_Date': str(course[3]) if course[3] else None,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get courses error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch courses'}), 500

@courses_bp.route('/<string:id>', methods=['GET'])
def get_course(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM [Course] WHERE Course_ID = %s', (id,))
        course = cursor.fetchone()
        conn.close()

        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404

        # Tuple access: Course_ID, Name, Credit, Start_Date
        return jsonify({
            'Course_ID': course[0],
            'Course_Name': course[1],  # Name
            'Credits': course[2],      # Credit
            'Start_Date': str(course[3]) if course[3] else None,
        })
    except Exception as e:
        print(f'Get course error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch course'}), 500

@courses_bp.route('/<string:id>/sections', methods=['GET'])
def get_course_sections(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM [Section] WHERE Course_ID = %s', (id,))
        sections = cursor.fetchall()
        conn.close()

        result = []
        for section in sections:
            # Tuple access: Section_ID, Course_ID, Semester
            result.append({
                'Section_ID': section[0],
                'Course_ID': section[1],
                'Semester': section[2],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get course sections error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch sections'}), 500

@courses_bp.route('/<string:course_id>/sections/<int:section_id>', methods=['GET'])
def get_section(course_id, section_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM [Section] WHERE Course_ID = %s AND Section_ID = %s', (course_id, section_id))
        section = cursor.fetchone()
        conn.close()

        if not section:
            return jsonify({'success': False, 'error': 'Section not found'}), 404

        # Tuple access: Section_ID, Course_ID, Semester
        return jsonify({
            'Section_ID': section[0],
            'Course_ID': section[1],
            'Semester': section[2],
        })
    except Exception as e:
        print(f'Get section error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch section'}), 500
