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
            result.append({
                'Course_ID': course.Course_ID,
                'Course_Name': course.Course_Name,
                'Credits': course.Credits,
                'Department_ID': course.Department_ID,
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
        cursor.execute('SELECT * FROM [Course] WHERE Course_ID = ?', id)
        course = cursor.fetchone()
        conn.close()

        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404

        return jsonify({
            'Course_ID': course.Course_ID,
            'Course_Name': course.Course_Name,
            'Credits': course.Credits,
            'Department_ID': course.Department_ID,
        })
    except Exception as e:
        print(f'Get course error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch course'}), 500

@courses_bp.route('/<string:id>/sections', methods=['GET'])
def get_course_sections(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM [Section] WHERE Course_ID = ?', id)
        sections = cursor.fetchall()
        conn.close()

        result = []
        for section in sections:
            result.append({
                'Section_ID': section.Section_ID,
                'Course_ID': section.Course_ID,
                'Semester_ID': section.Semester_ID,
                'Year': section.Year,
                'Room_ID': section.Room_ID,
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
        cursor.execute('SELECT * FROM [Section] WHERE Course_ID = ? AND Section_ID = ?', course_id, section_id)
        section = cursor.fetchone()
        conn.close()

        if not section:
            return jsonify({'success': False, 'error': 'Section not found'}), 404

        return jsonify({
            'Section_ID': section.Section_ID,
            'Course_ID': section.Course_ID,
            'Semester_ID': section.Semester_ID,
            'Year': section.Year,
            'Room_ID': section.Room_ID,
        })
    except Exception as e:
        print(f'Get section error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch section'}), 500
