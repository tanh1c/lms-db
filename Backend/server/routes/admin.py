from flask import Blueprint, request, jsonify
from config.database import get_db_connection
import bcrypt
import time

admin_bp = Blueprint('admin', __name__)

# ==================== COURSES MANAGEMENT ====================

@admin_bp.route('/courses', methods=['GET'])
def get_all_courses():
    """Get all courses with statistics - Using stored procedure GetAllCoursesWithStats"""
    start_time = time.time()
    try:
        print('[Backend] get_all_courses called')
        conn = get_db_connection()
        cursor = conn.cursor()
        # Use GetAllCoursesWithStats to get courses with section, student, and tutor counts
        cursor.execute('EXEC GetAllCoursesWithStats')
        courses = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_all_courses completed in {elapsed:.2f}s, returned {len(courses)} courses')

        result = []
        for course in courses:
            # Tuple access: Course_ID, Name, Credit, Start_Date, SectionCount, StudentCount, TutorCount
            result.append({
                'Course_ID': course[0],
                'Name': course[1],
                'Credit': course[2] if course[2] is not None else None,
                'Start_Date': str(course[3]) if course[3] else None,
                'SectionCount': int(course[4]) if len(course) > 4 and course[4] is not None else 0,
                'StudentCount': int(course[5]) if len(course) > 5 and course[5] is not None else 0,
                'TutorCount': int(course[6]) if len(course) > 6 and course[6] is not None else 0,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all courses error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch courses'}), 500

@admin_bp.route('/courses', methods=['POST'])
def create_course():
    """Create a new course - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC CreateCourse %s, %s, %s, %s', (
            data['Course_ID'],
            data['Name'],
            data.get('Credit'),
            data.get('Start_Date')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Course created successfully',
            'course': {
                'Course_ID': result[0],
                'Name': result[1],
                'Credit': result[2],
                'Start_Date': str(result[3]) if result[3] else None,
            }
        }), 201
    except Exception as e:
        print(f'Create course error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create course: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>', methods=['PUT'])
def update_course(course_id):
    """Update a course - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateCourse %s, %s, %s, %s', (
            course_id,
            data.get('Name'),
            data.get('Credit'),
            data.get('Start_Date')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Course updated successfully',
            'course': {
                'Course_ID': result[0],
                'Name': result[1],
                'Credit': result[2],
                'Start_Date': str(result[3]) if result[3] else None,
            }
        })
    except Exception as e:
        print(f'Update course error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update course: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Delete a course - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteCourse %s', (course_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Course deleted successfully'})
    except Exception as e:
        print(f'Delete course error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete course: {str(e)}'}), 500

@admin_bp.route('/courses/search', methods=['GET'])
def search_courses():
    """Search courses with advanced filters - Using stored procedure"""
    start_time = time.time()
    try:
        search_query = request.args.get('search', None)
        min_credit = request.args.get('min_credit', type=int)
        max_credit = request.args.get('max_credit', type=int)
        start_date_from = request.args.get('start_date_from', None)
        start_date_to = request.args.get('start_date_to', None)
        has_sections = request.args.get('has_sections', type=lambda x: x.lower() == 'true' if x else None)
        has_students = request.args.get('has_students', type=lambda x: x.lower() == 'true' if x else None)
        
        print(f'[Backend] search_courses called with filters: search={search_query}, min_credit={min_credit}, max_credit={max_credit}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC SearchCourses %s, %s, %s, %s, %s, %s, %s', (
            search_query,
            min_credit,
            max_credit,
            start_date_from,
            start_date_to,
            has_sections,
            has_students
        ))
        
        courses = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] search_courses completed in {elapsed:.2f}s, returned {len(courses)} courses')
        
        result = []
        for course in courses:
            result.append({
                'Course_ID': course[0],
                'Name': course[1],
                'Credit': course[2],
                'Start_Date': str(course[3]) if course[3] else None,
                'SectionCount': course[4] if len(course) > 4 else 0,
                'StudentCount': course[5] if len(course) > 5 else 0,
                'TutorCount': course[6] if len(course) > 6 else 0,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Search courses error: {e}')
        return jsonify({'success': False, 'error': f'Failed to search courses: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/details', methods=['GET'])
def get_course_details(course_id):
    """Get course details with statistics - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseDetails %s', (course_id,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Course not found'}), 404
        
        return jsonify({
            'Course_ID': result[0],
            'Name': result[1],
            'Credit': result[2],
            'Start_Date': str(result[3]) if result[3] else None,
            'TotalSections': result[4] if len(result) > 4 else 0,
            'TotalStudents': result[5] if len(result) > 5 else 0,
            'TotalTutors': result[6] if len(result) > 6 else 0,
            'TotalAssignments': result[7] if len(result) > 7 else 0,
            'TotalQuizzes': result[8] if len(result) > 8 else 0,
            'AverageFinalGrade': float(result[9]) if len(result) > 9 and result[9] else None,
        })
    except Exception as e:
        print(f'Get course details error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get course details: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/sections', methods=['GET'])
def get_course_sections(course_id):
    """Get all sections for a course - Using stored procedure"""
    start_time = time.time()
    try:
        print(f'[Backend] get_course_sections called for course_id={course_id}')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseSections %s', (course_id,))
        sections = cursor.fetchall()
        
        # Debug: Check actual data from database
        cursor.execute("""
            SELECT DISTINCT a.Status, COUNT(*) as Count
            FROM [Assessment] a
            INNER JOIN [Section] s ON a.Section_ID = s.Section_ID AND a.Course_ID = s.Course_ID AND a.Semester = s.Semester
            WHERE s.Course_ID = %s
            GROUP BY a.Status
        """, (course_id,))
        status_counts = cursor.fetchall()
        print(f'[Backend] Assessment Status distribution for course {course_id}: {status_counts}')
        
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_sections completed in {elapsed:.2f}s, returned {len(sections)} sections')
        
        result = []
        for section in sections:
            student_count = section[3] if len(section) > 3 else 0
            print(f'[Backend] Section {section[0]}: StudentCount = {student_count}')
            result.append({
                'Section_ID': section[0],
                'Course_ID': section[1],
                'Semester': section[2],
                'StudentCount': student_count,
                'TutorCount': section[4] if len(section) > 4 else 0,
                'TutorNames': section[5] if len(section) > 5 else None,
                'RoomCount': section[6] if len(section) > 6 else 0,
                'RoomsInfo': section[7] if len(section) > 7 else None,  # New field for room details
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get course sections error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get course sections: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/students', methods=['GET'])
def get_course_students(course_id):
    """Get all students enrolled in a course - Using stored procedure"""
    try:
        section_id = request.args.get('section_id', None)
        semester = request.args.get('semester', None)
        status = request.args.get('status', None)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseStudents %s, %s, %s, %s', (
            course_id,
            section_id,
            semester,
            status
        ))
        
        students = cursor.fetchall()
        conn.close()
        
        result = []
        for student in students:
            result.append({
                'University_ID': student[0],
                'First_Name': student[1],
                'Last_Name': student[2],
                'Email': student[3],
                'Major': student[4],
                'Current_degree': student[5],
                'Section_ID': student[6],
                'Semester': student[7],
                'Assessment_ID': student[8],
                'Registration_Date': str(student[9]) if student[9] else None,
                'Potential_Withdrawal_Date': str(student[10]) if len(student) > 10 and student[10] else None,
                'Status': student[11] if len(student) > 11 else None,
                'Final_Grade': float(student[12]) if len(student) > 12 and student[12] else None,
                'Midterm_Grade': float(student[13]) if len(student) > 13 and student[13] else None,
                'Quiz_Grade': float(student[14]) if len(student) > 14 and student[14] else None,
                'Assignment_Grade': float(student[15]) if len(student) > 15 and student[15] else None,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Get course students error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get course students: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/tutors', methods=['GET'])
def get_course_tutors(course_id):
    """Get all tutors teaching a course - Using stored procedure"""
    try:
        section_id = request.args.get('section_id', None)
        semester = request.args.get('semester', None)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseTutors %s, %s, %s', (
            course_id,
            section_id,
            semester
        ))
        
        tutors = cursor.fetchall()
        conn.close()
        
        result = []
        for tutor in tutors:
            result.append({
                'University_ID': tutor[0],
                'First_Name': tutor[1],
                'Last_Name': tutor[2],
                'Email': tutor[3],
                'TutorName': tutor[4],
                'Academic_Rank': tutor[5],
                'Department_Name': tutor[6],
                'Section_ID': tutor[7],
                'Semester': tutor[8],
                'Role_Specification': tutor[9],
                'Timestamp': str(tutor[10]) if len(tutor) > 10 and tutor[10] else None,
                'StudentCount': tutor[11] if len(tutor) > 11 else 0,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Get course tutors error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get course tutors: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/statistics', methods=['GET'])
def get_course_statistics(course_id):
    """Get detailed statistics for a course - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseStatistics %s', (course_id,))
        stats = cursor.fetchone()
        conn.close()
        
        if not stats:
            return jsonify({'success': False, 'error': 'Course not found'}), 404
        
        return jsonify({
            'TotalEnrolledStudents': int(stats[0]) if stats[0] else 0,
            'ApprovedStudents': int(stats[1]) if stats[1] else 0,
            'PendingStudents': int(stats[2]) if stats[2] else 0,
            'AverageFinalGrade': float(stats[3]) if stats[3] else None,
            'MinFinalGrade': float(stats[4]) if stats[4] else None,
            'MaxFinalGrade': float(stats[5]) if stats[5] else None,
            'TotalAssignments': int(stats[6]) if stats[6] else 0,
            'TotalQuizzes': int(stats[7]) if stats[7] else 0,
            'TotalSubmissions': int(stats[8]) if stats[8] else 0,
            'TotalSections': int(stats[9]) if stats[9] else 0,
            'TotalTutors': int(stats[10]) if stats[10] else 0,
        })
    except Exception as e:
        print(f'Get course statistics error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get course statistics: {str(e)}'}), 500

@admin_bp.route('/courses/by-semester/<string:semester>', methods=['GET'])
def get_courses_by_semester(semester):
    """Get all courses for a specific semester - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCoursesBySemester %s', (semester,))
        courses = cursor.fetchall()
        conn.close()
        
        result = []
        for course in courses:
            result.append({
                'Course_ID': course[0],
                'Name': course[1],
                'Credit': course[2],
                'Start_Date': str(course[3]) if course[3] else None,
                'SectionCount': course[4] if len(course) > 4 else 0,
                'StudentCount': course[5] if len(course) > 5 else 0,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Get courses by semester error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get courses by semester: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/enrollment-trend', methods=['GET'])
def get_course_enrollment_trend(course_id):
    """Get enrollment trend for a course across semesters - Using stored procedure"""
    try:
        start_semester = request.args.get('start_semester', None)
        end_semester = request.args.get('end_semester', None)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseEnrollmentTrend %s, %s, %s', (
            course_id,
            start_semester,
            end_semester
        ))
        
        trends = cursor.fetchall()
        conn.close()
        
        result = []
        for trend in trends:
            result.append({
                'Semester': trend[0],
                'EnrolledStudents': int(trend[1]) if trend[1] else 0,
                'SectionCount': int(trend[2]) if trend[2] else 0,
                'AverageGrade': float(trend[3]) if trend[3] else None,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Get course enrollment trend error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get enrollment trend: {str(e)}'}), 500

# ==================== SECTIONS MANAGEMENT ====================

@admin_bp.route('/sections', methods=['GET'])
def get_all_sections():
    """Get all sections - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllSections')
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
        print(f'Get all sections error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch sections'}), 500

@admin_bp.route('/sections', methods=['POST'])
def create_section():
    """Create a new section - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC CreateSection %s, %s, %s', (
            data['Section_ID'],
            data['Course_ID'],
            data['Semester']
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Section created successfully',
            'section': {
                'Section_ID': result[0],
                'Course_ID': result[1],
                'Semester': result[2],
            }
        }), 201
    except Exception as e:
        print(f'Create section error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create section: {str(e)}'}), 500

@admin_bp.route('/sections/<string:course_id>/<string:section_id>/<string:semester>', methods=['PUT'])
def update_section(course_id, section_id, semester):
    """Update a section"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Note: Section primary key is composite, so we can only update non-key fields
        # In this case, all fields are part of the key, so we might need to delete and recreate
        # For now, we'll just return an error or handle it differently
        return jsonify({'success': False, 'error': 'Section primary key cannot be updated. Delete and recreate instead.'}), 400
    except Exception as e:
        print(f'Update section error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update section: {str(e)}'}), 500

@admin_bp.route('/sections/<string:course_id>/<string:section_id>/<string:semester>', methods=['DELETE'])
def delete_section(course_id, section_id, semester):
    """Delete a section"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteSection %s, %s, %s', (section_id, course_id, semester))

        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Section deleted successfully'})
    except Exception as e:
        print(f'Delete section error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete section: {str(e)}'}), 500

# ==================== ASSIGNMENTS MANAGEMENT ====================

@admin_bp.route('/assignments', methods=['GET'])
def get_all_assignments():
    """Get all assignments - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllAssignments')
        assignments = cursor.fetchall()
        conn.close()

        result = []
        for assignment in assignments:
            # Tuple access: University_ID, Section_ID, Course_ID, Semester, Assessment_ID, MaxScore, accepted_specification, submission_deadline, instructions, Course_Name
            result.append({
                'University_ID': assignment[0],
                'Section_ID': assignment[1],
                'Course_ID': assignment[2],
                'Semester': assignment[3],
                'Assessment_ID': assignment[4],
                'MaxScore': assignment[5],
                'accepted_specification': assignment[6],
                'submission_deadline': str(assignment[7]) if assignment[7] else None,
                'instructions': assignment[8],
                'Course_Name': assignment[9],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all assignments error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch assignments'}), 500

@admin_bp.route('/assignments', methods=['POST'])
def create_assignment():
    """Create a new assignment - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Call stored procedure (Assessment_ID is OUTPUT parameter)
        # Note: pymssql doesn't support OUTPUT parameters directly, so we'll use a workaround
        # First get next Assessment_ID
        cursor.execute("""
            SELECT ISNULL(MAX(Assessment_ID), 0) + 1
            FROM [Assessment]
            WHERE University_ID = %s AND Section_ID = %s AND Course_ID = %s AND Semester = %s
        """, (
            data['University_ID'],
            data['Section_ID'],
            data['Course_ID'],
            data['Semester']
        ))
        next_id = cursor.fetchone()[0]
        data['Assessment_ID'] = next_id

        cursor.execute('EXEC CreateAssignment %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['University_ID'],
            data['Section_ID'],
            data['Course_ID'],
            data['Semester'],
            data['Assessment_ID'],
            data.get('MaxScore', 10),
            data.get('accepted_specification'),
            data['submission_deadline'],
            data.get('instructions')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assignment created successfully',
            'assignment': {
                'University_ID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Assessment_ID': result[4],
                'MaxScore': result[5],
                'accepted_specification': result[6],
                'submission_deadline': str(result[7]) if result[7] else None,
                'instructions': result[8],
                'Course_Name': result[9],
            }
        }), 201
    except Exception as e:
        print(f'Create assignment error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create assignment: {str(e)}'}), 500

@admin_bp.route('/assignments/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>/<int:assessment_id>', methods=['PUT'])
def update_assignment(university_id, section_id, course_id, semester, assessment_id):
    """Update an assignment - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateAssignment %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            section_id,
            course_id,
            semester,
            assessment_id,
            data.get('MaxScore'),
            data.get('accepted_specification'),
            data.get('submission_deadline'),
            data.get('instructions')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assignment updated successfully',
            'assignment': {
                'University_ID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Assessment_ID': result[4],
                'MaxScore': result[5],
                'accepted_specification': result[6],
                'submission_deadline': str(result[7]) if result[7] else None,
                'instructions': result[8],
                'Course_Name': result[9],
            }
        })
    except Exception as e:
        print(f'Update assignment error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update assignment: {str(e)}'}), 500

@admin_bp.route('/assignments/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>/<int:assessment_id>', methods=['DELETE'])
def delete_assignment(university_id, section_id, course_id, semester, assessment_id):
    """Delete an assignment - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteAssignment %s, %s, %s, %s, %s', (
            university_id, section_id, course_id, semester, assessment_id
        ))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Assignment deleted successfully'})
    except Exception as e:
        print(f'Delete assignment error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete assignment: {str(e)}'}), 500

# ==================== QUIZZES MANAGEMENT ====================

@admin_bp.route('/quizzes', methods=['GET'])
def get_all_quizzes():
    """Get all quizzes - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllQuizzes')
        quizzes = cursor.fetchall()
        conn.close()

        result = []
        for quiz in quizzes:
            # Tuple access: University_ID, Section_ID, Course_ID, Semester, Assessment_ID, Grading_method, pass_score, Time_limits, Start_Date, End_Date, Responses, completion_status, score, content, types, Weight, Correct_answer, Course_Name
            result.append({
                'University_ID': quiz[0],
                'Section_ID': quiz[1],
                'Course_ID': quiz[2],
                'Semester': quiz[3],
                'Assessment_ID': quiz[4],
                'Grading_method': quiz[5],
                'pass_score': float(quiz[6]) if quiz[6] else None,
                'Time_limits': str(quiz[7]) if quiz[7] else None,
                'Start_Date': str(quiz[8]) if quiz[8] else None,
                'End_Date': str(quiz[9]) if quiz[9] else None,
                'Responses': quiz[10],
                'completion_status': quiz[11],
                'score': float(quiz[12]) if quiz[12] else None,
                'content': quiz[13],
                'types': quiz[14],
                'Weight': float(quiz[15]) if quiz[15] else None,
                'Correct_answer': quiz[16],
                'Course_Name': quiz[17],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all quizzes error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch quizzes'}), 500

@admin_bp.route('/quizzes', methods=['POST'])
def create_quiz():
    """Create a new quiz - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get next Assessment_ID (similar to CreateAssignment)
        cursor.execute("""
            SELECT ISNULL(MAX(Assessment_ID), 0) + 1
            FROM [Assessment]
            WHERE University_ID = %s AND Section_ID = %s AND Course_ID = %s AND Semester = %s
        """, (
            data['University_ID'],
            data['Section_ID'],
            data['Course_ID'],
            data['Semester']
        ))
        next_id = cursor.fetchone()[0]
        data['Assessment_ID'] = next_id

        cursor.execute('EXEC CreateQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['University_ID'],
            data['Section_ID'],
            data['Course_ID'],
            data['Semester'],
            data['Assessment_ID'],
            data.get('Grading_method', 'Highest Attemp'),
            data.get('pass_score', 5),
            data['Time_limits'],
            data['Start_Date'],
            data['End_Date'],
            data['content'],
            data.get('types'),
            data.get('Weight'),
            data['Correct_answer']
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Quiz created successfully',
            'quiz': {
                'University_ID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Assessment_ID': result[4],
                'Grading_method': result[5],
                'pass_score': float(result[6]) if result[6] else None,
                'Time_limits': str(result[7]) if result[7] else None,
                'Start_Date': str(result[8]) if result[8] else None,
                'End_Date': str(result[9]) if result[9] else None,
                'Responses': result[10],
                'completion_status': result[11],
                'score': float(result[12]) if result[12] else None,
                'content': result[13],
                'types': result[14],
                'Weight': float(result[15]) if result[15] else None,
                'Correct_answer': result[16],
                'Course_Name': result[17],
            }
        }), 201
    except Exception as e:
        print(f'Create quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create quiz: {str(e)}'}), 500

@admin_bp.route('/quizzes/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>/<int:assessment_id>', methods=['PUT'])
def update_quiz(university_id, section_id, course_id, semester, assessment_id):
    """Update a quiz - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            section_id,
            course_id,
            semester,
            assessment_id,
            data.get('Grading_method'),
            data.get('pass_score'),
            data.get('Time_limits'),
            data.get('Start_Date'),
            data.get('End_Date'),
            data.get('content'),
            data.get('types'),
            data.get('Weight'),
            data.get('Correct_answer')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Quiz updated successfully',
            'quiz': {
                'University_ID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Assessment_ID': result[4],
                'Grading_method': result[5],
                'pass_score': float(result[6]) if result[6] else None,
                'Time_limits': str(result[7]) if result[7] else None,
                'Start_Date': str(result[8]) if result[8] else None,
                'End_Date': str(result[9]) if result[9] else None,
                'Responses': result[10],
                'completion_status': result[11],
                'score': float(result[12]) if result[12] else None,
                'content': result[13],
                'types': result[14],
                'Weight': float(result[15]) if result[15] else None,
                'Correct_answer': result[16],
                'Course_Name': result[17],
            }
        })
    except Exception as e:
        print(f'Update quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update quiz: {str(e)}'}), 500

@admin_bp.route('/quizzes/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>/<int:assessment_id>', methods=['DELETE'])
def delete_quiz(university_id, section_id, course_id, semester, assessment_id):
    """Delete a quiz - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteQuiz %s, %s, %s, %s, %s', (
            university_id, section_id, course_id, semester, assessment_id
        ))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Quiz deleted successfully'})
    except Exception as e:
        print(f'Delete quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete quiz: {str(e)}'}), 500

# ==================== STUDENTS MANAGEMENT ====================

@admin_bp.route('/students', methods=['GET'])
def get_all_students():
    """Get all students with user info"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, u.First_Name, u.Last_Name, u.Email, u.Phone_Number, u.Address, u.National_ID
            FROM [Student] s
            INNER JOIN [Users] u ON s.University_ID = u.University_ID
            ORDER BY s.University_ID
        """)
        students = cursor.fetchall()
        conn.close()

        result = []
        for student in students:
            # Tuple access: s.* (University_ID, Major, Current_degree), u.First_Name, u.Last_Name, u.Email, u.Phone_Number, u.Address, u.National_ID
            result.append({
                'University_ID': student[0],
                'Major': student[1],
                'Current_degree': student[2],
                'First_Name': student[3],
                'Last_Name': student[4],
                'Email': student[5],
                'Phone_Number': student[6],
                'Address': student[7],
                'National_ID': student[8],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all students error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch students'}), 500

@admin_bp.route('/students', methods=['POST'])
def create_student():
    """Create a new student - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Hash password if provided
        password = data.get('Password', '123456')
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute('EXEC CreateStudent %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['University_ID'],
            data['First_Name'],
            data['Last_Name'],
            data['Email'],
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data['Major'],
            data.get('Current_degree', 'Bachelor'),
            hashed_password
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Student created successfully',
            'student': {
                'University_ID': result[0],
                'Major': result[1],
                'Current_degree': result[2],
                'First_Name': result[3],
                'Last_Name': result[4],
                'Email': result[5],
                'Phone_Number': result[6],
                'Address': result[7],
                'National_ID': result[8],
            }
        }), 201
    except Exception as e:
        print(f'Create student error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create student: {str(e)}'}), 500

@admin_bp.route('/students/<int:university_id>', methods=['PUT'])
def update_student(university_id):
    """Update a student - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateStudent %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            data.get('First_Name'),
            data.get('Last_Name'),
            data.get('Email'),
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data.get('Major'),
            data.get('Current_degree')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Student updated successfully',
            'student': {
                'University_ID': result[0],
                'Major': result[1],
                'Current_degree': result[2],
                'First_Name': result[3],
                'Last_Name': result[4],
                'Email': result[5],
                'Phone_Number': result[6],
                'Address': result[7],
                'National_ID': result[8],
            }
        })
    except Exception as e:
        print(f'Update student error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update student: {str(e)}'}), 500

@admin_bp.route('/students/<int:university_id>', methods=['DELETE'])
def delete_student(university_id):
    """Delete a student - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteStudent %s', (university_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Student deleted successfully'})
    except Exception as e:
        print(f'Delete student error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete student: {str(e)}'}), 500

# ==================== TUTORS MANAGEMENT ====================

@admin_bp.route('/tutors', methods=['GET'])
def get_all_tutors():
    """Get all tutors with user info - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllTutors')
        tutors = cursor.fetchall()
        conn.close()

        result = []
        for tutor in tutors:
            # Tuple access: University_ID, Name, Academic_Rank, Details, Issuance_Date, Department_Name, First_Name, Last_Name, Email, Phone_Number, Address, National_ID
            result.append({
                'University_ID': tutor[0],
                'Name': tutor[1],
                'Academic_Rank': tutor[2],
                'Details': tutor[3],
                'Issuance_Date': str(tutor[4]) if tutor[4] else None,
                'Department_Name': tutor[5],
                'First_Name': tutor[6],
                'Last_Name': tutor[7],
                'Email': tutor[8],
                'Phone_Number': tutor[9],
                'Address': tutor[10],
                'National_ID': tutor[11],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all tutors error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch tutors'}), 500

@admin_bp.route('/tutors', methods=['POST'])
def create_tutor():
    """Create a new tutor - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Hash password if provided
        password = data.get('Password', '123456')
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute('EXEC CreateTutor %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['University_ID'],
            data['First_Name'],
            data['Last_Name'],
            data['Email'],
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data.get('Name'),
            data.get('Academic_Rank'),
            data.get('Details'),
            data.get('Department_Name'),
            hashed_password
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Tutor created successfully',
            'tutor': {
                'University_ID': result[0],
                'Name': result[1],
                'Academic_Rank': result[2],
                'Details': result[3],
                'Issuance_Date': str(result[4]) if result[4] else None,
                'Department_Name': result[5],
                'First_Name': result[6],
                'Last_Name': result[7],
                'Email': result[8],
                'Phone_Number': result[9],
                'Address': result[10],
                'National_ID': result[11],
            }
        }), 201
    except Exception as e:
        print(f'Create tutor error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create tutor: {str(e)}'}), 500

@admin_bp.route('/tutors/<int:university_id>', methods=['PUT'])
def update_tutor(university_id):
    """Update a tutor - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateTutor %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            data.get('First_Name'),
            data.get('Last_Name'),
            data.get('Email'),
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data.get('Name'),
            data.get('Academic_Rank'),
            data.get('Details'),
            data.get('Department_Name')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Tutor updated successfully',
            'tutor': {
                'University_ID': result[0],
                'Name': result[1],
                'Academic_Rank': result[2],
                'Details': result[3],
                'Issuance_Date': str(result[4]) if result[4] else None,
                'Department_Name': result[5],
                'First_Name': result[6],
                'Last_Name': result[7],
                'Email': result[8],
                'Phone_Number': result[9],
                'Address': result[10],
                'National_ID': result[11],
            }
        })
    except Exception as e:
        print(f'Update tutor error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update tutor: {str(e)}'}), 500

@admin_bp.route('/tutors/<int:university_id>', methods=['DELETE'])
def delete_tutor(university_id):
    """Delete a tutor - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteTutor %s', (university_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Tutor deleted successfully'})
    except Exception as e:
        print(f'Delete tutor error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete tutor: {str(e)}'}), 500

# ==================== ASSESSMENTS/GRADES MANAGEMENT ====================

@admin_bp.route('/assessments', methods=['GET'])
def get_all_assessments():
    """Get all assessments with grades"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Set query timeout to 25 seconds
        cursor.execute("SET QUERY_GOVERNOR_COST_LIMIT 0")
        cursor.execute("SET LOCK_TIMEOUT 25000")
        
        cursor.execute("""
            SELECT a.*, u.First_Name, u.Last_Name, c.Name as Course_Name
            FROM [Assessment] a
            INNER JOIN [Users] u ON a.University_ID = u.University_ID
            INNER JOIN [Course] c ON a.Course_ID = c.Course_ID
            ORDER BY a.Registration_Date DESC
        """)
        assessments = cursor.fetchall()
        conn.close()

        result = []
        for assessment in assessments:
            # Tuple access: a.* (University_ID, Section_ID, Course_ID, Semester, Assessment_ID, Registration_Date, Potential_Withdrawal_Date, Status, Final_Grade, Midterm_Grade, Quiz_Grade, Assignment_Grade), u.First_Name, u.Last_Name, Course_Name
            result.append({
                'University_ID': assessment[0],
                'Section_ID': assessment[1],
                'Course_ID': assessment[2],
                'Semester': assessment[3],
                'Assessment_ID': assessment[4],
                'Registration_Date': str(assessment[5]) if assessment[5] else None,
                'Potential_Withdrawal_Date': str(assessment[6]) if assessment[6] else None,
                'Status': assessment[7],
                'Final_Grade': float(assessment[8]) if assessment[8] else None,
                'Midterm_Grade': float(assessment[9]) if assessment[9] else None,
                'Quiz_Grade': float(assessment[10]) if assessment[10] else None,
                'Assignment_Grade': float(assessment[11]) if assessment[11] else None,
                'First_Name': assessment[12],
                'Last_Name': assessment[13],
                'Student_Name': f"{assessment[12]} {assessment[13]}",
                'Course_Name': assessment[14],  # Course_Name from JOIN
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all assessments error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch assessments: {str(e)}'}), 500

@admin_bp.route('/assessments/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>/<int:assessment_id>', methods=['PUT'])
def update_assessment_grade(university_id, section_id, course_id, semester, assessment_id):
    """Update assessment grades - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateAssessmentGrade %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            section_id,
            course_id,
            semester,
            assessment_id,
            data.get('Final_Grade'),
            data.get('Midterm_Grade'),
            data.get('Quiz_Grade'),
            data.get('Assignment_Grade'),
            data.get('Status', 'Pending')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assessment grades updated successfully',
            'assessment': {
                'University_ID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Assessment_ID': result[4],
                'Registration_Date': str(result[5]) if result[5] else None,
                'Potential_Withdrawal_Date': str(result[6]) if result[6] else None,
                'Status': result[7],
                'Final_Grade': float(result[8]) if result[8] else None,
                'Midterm_Grade': float(result[9]) if result[9] else None,
                'Quiz_Grade': float(result[10]) if result[10] else None,
                'Assignment_Grade': float(result[11]) if result[11] else None,
                'First_Name': result[12],
                'Last_Name': result[13],
                'Course_Name': result[14],
            }
        })
    except Exception as e:
        print(f'Update assessment grade error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update assessment: {str(e)}'}), 500

# ==================== SUBMISSIONS MANAGEMENT ====================

@admin_bp.route('/submissions', methods=['GET'])
def get_all_submissions():
    """Get all submissions"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, u.First_Name, u.Last_Name, c.Name as Course_Name
            FROM [Submission] s
            INNER JOIN [Users] u ON s.University_ID = u.University_ID
            INNER JOIN [Course] c ON s.Course_ID = c.Course_ID
            ORDER BY s.SubmitDate DESC
        """)
        submissions = cursor.fetchall()
        conn.close()

        result = []
        for submission in submissions:
            # Tuple access: s.* (Submission_No, University_ID, Section_ID, Course_ID, Semester, Assessment_ID, accepted_specification, late_flag_indicator, SubmitDate, attached_files, status), u.First_Name, u.Last_Name, Course_Name
            result.append({
                'Submission_No': submission[0],
                'University_ID': submission[1],
                'Section_ID': submission[2],
                'Course_ID': submission[3],
                'Semester': submission[4],
                'Assessment_ID': submission[5],
                'accepted_specification': submission[6],
                'late_flag_indicator': bool(submission[7]) if submission[7] is not None else None,
                'SubmitDate': str(submission[8]) if submission[8] else None,
                'attached_files': submission[9],
                'status': submission[10],
                'First_Name': submission[11],
                'Last_Name': submission[12],
                'Student_Name': f"{submission[11]} {submission[12]}",
                'Course_Name': submission[13],  # Course_Name from JOIN
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all submissions error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch submissions'}), 500

# ==================== STATISTICS/DASHBOARD ====================

@admin_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get system statistics for admin dashboard - Using stored procedure"""
    start_time = time.time()
    conn = None
    try:
        print('[Backend] get_statistics called')
        conn = get_db_connection()
        cursor = conn.cursor()

        # Call stored procedure
        cursor.execute('EXEC GetStatistics')
        result = cursor.fetchone()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_statistics completed in {elapsed:.2f}s')
        
        if not result:
            # If no result, return zeros
            stats = {
                'total_users': 0,
                'total_students': 0,
                'total_tutors': 0,
                'total_admins': 0,
                'total_courses': 0,
                'total_sections': 0,
                'total_assignments': 0,
                'total_quizzes': 0,
                'total_submissions': 0,
                'pending_assessments': 0,
            }
        else:
            stats = {
                'total_users': int(result[0]) if result[0] is not None else 0,
                'total_students': int(result[1]) if result[1] is not None else 0,
                'total_tutors': int(result[2]) if result[2] is not None else 0,
                'total_admins': int(result[3]) if result[3] is not None else 0,
                'total_courses': int(result[4]) if result[4] is not None else 0,
                'total_sections': int(result[5]) if result[5] is not None else 0,
                'total_assignments': int(result[6]) if result[6] is not None else 0,
                'total_quizzes': int(result[7]) if result[7] is not None else 0,
                'total_submissions': int(result[8]) if result[8] is not None else 0,
                'pending_assessments': int(result[9]) if result[9] is not None else 0,
            }

        if conn:
            conn.close()

        return jsonify(stats)
    except Exception as e:
        print(f'Get statistics error: {e}')
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()
        # Return zeros instead of error to prevent frontend issues
        return jsonify({
            'total_users': 0,
            'total_students': 0,
            'total_tutors': 0,
            'total_admins': 0,
            'total_courses': 0,
            'total_sections': 0,
            'total_assignments': 0,
            'total_quizzes': 0,
            'total_submissions': 0,
            'pending_assessments': 0,
        })

# ==================== TEACHES MANAGEMENT (Assign Tutor to Section) ====================

@admin_bp.route('/teaches', methods=['GET'])
def get_all_teaches():
    """Get all tutor-section assignments"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, u.First_Name, u.Last_Name, c.Name as Course_Name
            FROM [Teaches] t
            INNER JOIN [Users] u ON t.University_ID = u.University_ID
            INNER JOIN [Course] c ON t.Course_ID = c.Course_ID
            ORDER BY t.Timestamp DESC
        """)
        teaches = cursor.fetchall()
        conn.close()

        result = []
        for teach in teaches:
            # Tuple access: t.* (University_ID, Section_ID, Course_ID, Semester, Role_Specification, Timestamp), u.First_Name, u.Last_Name, Course_Name
            result.append({
                'University_ID': teach[0],
                'Section_ID': teach[1],
                'Course_ID': teach[2],
                'Semester': teach[3],
                'Role_Specification': teach[4],
                'Timestamp': str(teach[5]) if teach[5] else None,
                'First_Name': teach[6],
                'Last_Name': teach[7],
                'Tutor_Name': f"{teach[6]} {teach[7]}",
                'Course_Name': teach[8],  # Course_Name from JOIN
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all teaches error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch teaches'}), 500

@admin_bp.route('/teaches', methods=['POST'])
def create_teaches():
    """Assign a tutor to a section"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO [Teaches] (University_ID, Section_ID, Course_ID, Semester, Role_Specification, Timestamp)
            VALUES (?, ?, ?, ?, ?, GETDATE())
        """,
            data['University_ID'],
            data['Section_ID'],
            data['Course_ID'],
            data['Semester'],
            data.get('Role_Specification')
        )

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Tutor assigned to section successfully',
            'teaches': data
        }), 201
    except Exception as e:
        print(f'Create teaches error: {e}')
        return jsonify({'success': False, 'error': f'Failed to assign tutor: {str(e)}'}), 500

@admin_bp.route('/teaches/<int:university_id>/<string:section_id>/<string:course_id>/<string:semester>', methods=['DELETE'])
def delete_teaches(university_id, section_id, course_id, semester):
    """Remove tutor from section"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM [Teaches]
            WHERE University_ID = ? AND Section_ID = ? AND Course_ID = ? AND Semester = ?
        """, university_id, section_id, course_id, semester)

        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Tutor removed from section successfully'})
    except Exception as e:
        print(f'Delete teaches error: {e}')
        return jsonify({'success': False, 'error': f'Failed to remove tutor: {str(e)}'}), 500

# ==================== BUILDINGS & ROOMS MANAGEMENT ====================

@admin_bp.route('/buildings', methods=['GET'])
def get_all_buildings():
    """Get all buildings"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT Building_Name FROM [Building] ORDER BY Building_Name')
        buildings = cursor.fetchall()
        conn.close()

        result = []
        for building in buildings:
            result.append({
                'Building_Name': building[0],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all buildings error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch buildings'}), 500

@admin_bp.route('/buildings', methods=['POST'])
def create_building():
    """Create a new building"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO [Building] (Building_Name)
            VALUES (?)
        """, (data['Building_Name'],))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Building created successfully',
            'building': {
                'Building_Name': data['Building_Name']
            }
        }), 201
    except Exception as e:
        print(f'Create building error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create building: {str(e)}'}), 500

@admin_bp.route('/rooms', methods=['GET'])
def get_all_rooms():
    """Get all rooms with building info - Using stored procedure"""
    try:
        building_name = request.args.get('building_name', type=str)
        search = request.args.get('search', type=str)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllRooms %s, %s', (building_name, search))
        rooms = cursor.fetchall()
        conn.close()

        result = []
        for room in rooms:
            result.append({
                'Room_ID': room[0],
                'Building_Name': room[1],
                'Room_Name': room[2],
                'Capacity': room[3] if room[3] is not None else None,
                'UsageCount': room[4] if len(room) > 4 and room[4] is not None else 0,
                'EquipmentCount': room[5] if len(room) > 5 and room[5] is not None else 0,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all rooms error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to fetch rooms'}), 500

@admin_bp.route('/rooms', methods=['POST'])
def create_room():
    """Create a new room - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC CreateRoom %s, %s, %s', (
            data['Building_Name'], 
            data['Room_Name'], 
            data.get('Capacity', 30)
        ))
        result = cursor.fetchone()
        conn.commit()
        conn.close()

        if result:
            return jsonify({
                'success': True,
                'message': 'Room created successfully',
                'room': {
                    'Room_ID': result[0],
                    'Building_Name': result[1],
                    'Room_Name': result[2],
                    'Capacity': result[3] if result[3] is not None else None,
                    'UsageCount': 0
                }
            }), 201
        else:
            return jsonify({'success': False, 'error': 'Failed to create room'}), 500
    except Exception as e:
        print(f'Create room error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to create room: {str(e)}'}), 500

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>', methods=['PUT'])
def update_room(building_name, room_name):
    """Update a room - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC UpdateRoom %s, %s, %s, %s, %s', 
                      (building_name, room_name,
                       data.get('New_Building_Name'), 
                       data.get('New_Room_Name'),
                       data.get('Capacity')))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Room updated successfully'
        })
    except Exception as e:
        print(f'Update room error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update room: {str(e)}'}), 500

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>', methods=['DELETE'])
def delete_room(building_name, room_name):
    """Delete a room - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC DeleteRoom %s, %s', (building_name, room_name))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Room deleted successfully'
        })
    except Exception as e:
        print(f'Delete room error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to delete room: {str(e)}'}), 500

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>/equipment', methods=['GET'])
def get_room_equipment(building_name, room_name):
    """Get equipment for a specific room - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetRoomEquipment %s, %s', (building_name, room_name))
        equipment = cursor.fetchall()
        conn.close()

        result = []
        for eq in equipment:
            result.append({
                'Equipment_Name': eq[0],
                'Building_Name': eq[1],
                'Room_Name': eq[2],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get room equipment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch room equipment: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/rooms', methods=['GET'])
def get_section_rooms(section_id, course_id, semester):
    """Get rooms assigned to a section - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetRoomsBySection %s, %s, %s', (section_id, course_id, semester))
        rooms = cursor.fetchall()
        conn.close()

        result = []
        for room in rooms:
            result.append({
                'Room_ID': room[0],
                'Building_Name': room[1],
                'Room_Name': room[2],
                'Capacity': room[3] if room[3] is not None else None,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get section rooms error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch section rooms: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/rooms', methods=['POST'])
def assign_room_to_section(section_id, course_id, semester):
    """Assign a room to a section - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC AssignRoomToSection %s, %s, %s, %s, %s',
                      (section_id, course_id, semester,
                       data['Building_Name'], data['Room_Name']))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Room assigned successfully'
        })
    except Exception as e:
        print(f'Assign room to section error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to assign room: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/rooms/<string:building_name>/<string:room_name>', methods=['DELETE'])
def remove_room_from_section(section_id, course_id, semester, building_name, room_name):
    """Remove a room from a section - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC RemoveRoomFromSection %s, %s, %s, %s, %s',
                      (section_id, course_id, semester, building_name, room_name))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Room removed successfully'
        })
    except Exception as e:
        print(f'Remove room from section error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to remove room: {str(e)}'}), 500

# ==================== ADMIN ACCOUNTS MANAGEMENT ====================

@admin_bp.route('/admins', methods=['GET'])
def get_all_admins():
    """Get all admin accounts - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllAdmins')
        admins = cursor.fetchall()
        conn.close()

        result = []
        for admin in admins:
            # Tuple access: University_ID, Type, First_Name, Last_Name, Email, Phone_Number, Address, National_ID
            result.append({
                'University_ID': admin[0],
                'Type': admin[1],
                'First_Name': admin[2],
                'Last_Name': admin[3],
                'Email': admin[4],
                'Phone_Number': admin[5],
                'Address': admin[6],
                'National_ID': admin[7],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all admins error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch admins'}), 500

@admin_bp.route('/admins', methods=['POST'])
def create_admin():
    """Create a new admin account - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Hash password if provided
        password = data.get('Password', '123456')
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute('EXEC CreateAdmin %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['University_ID'],
            data['First_Name'],
            data['Last_Name'],
            data['Email'],
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data.get('Type', 'Program Administrator'),
            hashed_password
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Admin created successfully',
            'admin': {
                'University_ID': result[0],
                'Type': result[1],
                'First_Name': result[2],
                'Last_Name': result[3],
                'Email': result[4],
                'Phone_Number': result[5],
                'Address': result[6],
                'National_ID': result[7],
            }
        }), 201
    except Exception as e:
        print(f'Create admin error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create admin: {str(e)}'}), 500

@admin_bp.route('/admins/<int:university_id>', methods=['PUT'])
def update_admin(university_id):
    """Update an admin - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC UpdateAdmin %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            data.get('First_Name'),
            data.get('Last_Name'),
            data.get('Email'),
            data.get('Phone_Number'),
            data.get('Address'),
            data.get('National_ID'),
            data.get('Type')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Admin updated successfully',
            'admin': {
                'University_ID': result[0],
                'Type': result[1],
                'First_Name': result[2],
                'Last_Name': result[3],
                'Email': result[4],
                'Phone_Number': result[5],
                'Address': result[6],
                'National_ID': result[7],
            }
        })
    except Exception as e:
        print(f'Update admin error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update admin: {str(e)}'}), 500

@admin_bp.route('/admins/<int:university_id>', methods=['DELETE'])
def delete_admin(university_id):
    """Delete an admin - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteAdmin %s', (university_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Admin deleted successfully'})
    except Exception as e:
        print(f'Delete admin error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete admin: {str(e)}'}), 500

# ==================== REVIEW MANAGEMENT (Grade Submissions) ====================

@admin_bp.route('/reviews', methods=['GET'])
def get_all_reviews():
    """Get all reviews (graded submissions)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, 
                   s.University_ID as Student_ID,
                   su.First_Name as Student_First_Name, 
                   su.Last_Name as Student_Last_Name,
                   t.Name as Tutor_Name,
                   tu.First_Name as Tutor_First_Name,
                   tu.Last_Name as Tutor_Last_Name
            FROM [review] r
            INNER JOIN [Submission] s ON r.Submission_No = s.Submission_No
            INNER JOIN [Users] su ON s.University_ID = su.University_ID
            INNER JOIN [Tutor] t ON r.University_ID = t.University_ID
            INNER JOIN [Users] tu ON r.University_ID = tu.University_ID
            ORDER BY r.Submission_No DESC
        """)
        reviews = cursor.fetchall()
        conn.close()

        result = []
        for review in reviews:
            result.append({
                'Submission_No': review.Submission_No,
                'Student_ID': review.Student_ID,
                'Student_Name': f"{review.Student_First_Name} {review.Student_Last_Name}",
                'Tutor_ID': review.University_ID,
                'Tutor_Name': review.Tutor_Name,
                'Tutor_Full_Name': f"{review.Tutor_First_Name} {review.Tutor_Last_Name}",
                'Score': review.Score,
                'Comments': review.Comments,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all reviews error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch reviews'}), 500

@admin_bp.route('/reviews', methods=['POST'])
def create_review():
    """Create a review (grade a submission)"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO [review] (Submission_No, University_ID, Score, Comments)
            VALUES (?, ?, ?, ?)
        """,
            data['Submission_No'],
            data['University_ID'],
            data.get('Score'),
            data.get('Comments')
        )

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Review created successfully',
            'review': data
        }), 201
    except Exception as e:
        print(f'Create review error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create review: {str(e)}'}), 500

@admin_bp.route('/reviews/<int:submission_no>', methods=['PUT'])
def update_review(submission_no):
    """Update a review"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE [review]
            SET Score = ?,
                Comments = ?
            WHERE Submission_No = ?
        """,
            data.get('Score'),
            data.get('Comments'),
            submission_no
        )

        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Review updated successfully'})
    except Exception as e:
        print(f'Update review error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update review: {str(e)}'}), 500

# ==================== FILTER USERS ====================

@admin_bp.route('/users/filter', methods=['GET'])
def filter_users():
    """Filter users with advanced filters - Using stored procedure"""
    try:
        role = request.args.get('role', None)
        major = request.args.get('major', None)
        department = request.args.get('department', None)
        admin_type = request.args.get('type', None)
        search_query = request.args.get('search', None)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC FilterUsers %s, %s, %s, %s, %s', (
            role,
            major,
            department,
            admin_type,
            search_query
        ))
        
        results = cursor.fetchall()
        conn.close()
        
        users = []
        for row in results:
            # Tuple: University_ID, First_Name, Last_Name, Email, Phone_Number, Address, National_ID, Role, Major, Current_degree, Department_Name, Type, Name, Academic_Rank, Details
            user = {
                'University_ID': row[0],
                'First_Name': row[1],
                'Last_Name': row[2],
                'Email': row[3],
                'Phone_Number': row[4],
                'Address': row[5],
                'National_ID': row[6],
                'role': row[7],
            }
            
            # Add role-specific fields
            if row[7] == 'student':
                user['Major'] = row[8]
                user['Current_degree'] = row[9]
            elif row[7] == 'tutor':
                user['Department_Name'] = row[10]
                user['Name'] = row[12]
                user['Academic_Rank'] = row[13]
                user['Details'] = row[14]
            elif row[7] == 'admin':
                user['Type'] = row[11]
            
            users.append(user)
        
        return jsonify(users)
    except Exception as e:
        print(f'Filter users error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to filter users: {str(e)}'}), 500

@admin_bp.route('/users/filter-options', methods=['GET'])
def get_filter_options():
    """Get filter options (majors, departments, admin types)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get distinct majors
        cursor.execute('EXEC GetDistinctMajors')
        majors = [row[0] for row in cursor.fetchall()]
        
        # Get distinct departments
        cursor.execute('EXEC GetDistinctDepartments')
        departments = [row[0] for row in cursor.fetchall()]
        
        # Get distinct admin types
        cursor.execute('EXEC GetDistinctAdminTypes')
        admin_types = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'majors': majors,
            'departments': departments,
            'admin_types': admin_types
        })
    except Exception as e:
        print(f'Get filter options error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get filter options: {str(e)}'}), 500

# ==================== UPDATE USER ROLE ====================

@admin_bp.route('/users/<int:university_id>/role', methods=['PUT'])
def update_user_role(university_id):
    """Update user role - Using stored procedure"""
    try:
        data = request.get_json()
        new_role = data.get('role')
        
        if not new_role or new_role not in ['student', 'tutor', 'admin']:
            return jsonify({'success': False, 'error': 'Invalid role. Must be student, tutor, or admin'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Prepare parameters based on new role
        if new_role == 'student':
            if not data.get('Major'):
                conn.close()
                return jsonify({'success': False, 'error': 'Major is required when changing role to student'}), 400
            
            cursor.execute('EXEC UpdateUserRole %s, %s, %s, %s, %s, %s, %s, %s, %s', (
                university_id,
                new_role,
                data.get('Major'),
                data.get('Current_degree', 'Bachelor'),
                None,  # Name
                None,  # Academic_Rank
                None,  # Details
                None,  # Department_Name
                None   # Type
            ))
        elif new_role == 'tutor':
            cursor.execute('EXEC UpdateUserRole %s, %s, %s, %s, %s, %s, %s, %s, %s', (
                university_id,
                new_role,
                None,  # Major
                None,  # Current_degree
                data.get('Name'),
                data.get('Academic_Rank'),
                data.get('Details'),
                data.get('Department_Name'),
                None   # Type
            ))
        elif new_role == 'admin':
            cursor.execute('EXEC UpdateUserRole %s, %s, %s, %s, %s, %s, %s, %s, %s', (
                university_id,
                new_role,
                None,  # Major
                None,  # Current_degree
                None,  # Name
                None,  # Academic_Rank
                None,  # Details
                None,  # Department_Name
                data.get('Type', 'Program Administrator')
            ))
        
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        # Format result based on role
        if new_role == 'student':
            return jsonify({
                'success': True,
                'message': 'User role updated successfully',
                'user': {
                    'University_ID': result[0],
                    'Major': result[1],
                    'Current_degree': result[2],
                    'First_Name': result[3],
                    'Last_Name': result[4],
                    'Email': result[5],
                    'Phone_Number': result[6],
                    'Address': result[7],
                    'National_ID': result[8],
                }
            })
        elif new_role == 'tutor':
            return jsonify({
                'success': True,
                'message': 'User role updated successfully',
                'user': {
                    'University_ID': result[0],
                    'Name': result[1],
                    'Academic_Rank': result[2],
                    'Details': result[3],
                    'Issuance_Date': str(result[4]) if result[4] else None,
                    'Department_Name': result[5],
                    'First_Name': result[6],
                    'Last_Name': result[7],
                    'Email': result[8],
                    'Phone_Number': result[9],
                    'Address': result[10],
                    'National_ID': result[11],
                }
            })
        elif new_role == 'admin':
            return jsonify({
                'success': True,
                'message': 'User role updated successfully',
                'user': {
                    'University_ID': result[0],
                    'Type': result[1],
                    'First_Name': result[2],
                    'Last_Name': result[3],
                    'Email': result[4],
                    'Phone_Number': result[5],
                    'Address': result[6],
                    'National_ID': result[7],
                }
            })
    except Exception as e:
        print(f'Update user role error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update user role: {str(e)}'}), 500

# ==================== RESET USER PASSWORD ====================

@admin_bp.route('/users/<int:university_id>/reset-password', methods=['POST'])
def reset_user_password(university_id):
    """Reset user password - Using stored procedure"""
    try:
        # Default password
        default_password = '123456'
        hashed_password = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute("SELECT University_ID FROM [Account] WHERE University_ID = %s", (university_id,))
        account_exists = cursor.fetchone()
        
        if account_exists:
            # Update existing account
            cursor.execute("""
                UPDATE [Account] 
                SET Password = %s 
                WHERE University_ID = %s
            """, (hashed_password, university_id))
        else:
            # Create new account
            cursor.execute("""
                INSERT INTO [Account] (University_ID, Password)
                VALUES (%s, %s)
            """, (university_id, hashed_password))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully',
            'default_password': default_password
        })
    except Exception as e:
        print(f'Reset password error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to reset password: {str(e)}'}), 500

# ==================== GET USER DETAILS ====================

@admin_bp.route('/users/<int:university_id>/details', methods=['GET'])
def get_user_details(university_id):
    """Get detailed information about a user - Using stored procedures"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user basic info and role
        cursor.execute('EXEC GetUserDetails %s', (university_id,))
        user_info = cursor.fetchone()
        
        if not user_info:
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Parse user info (tuple access)
        role = user_info[7]  # Role
        
        role_specific_info = {}
        if role == 'student':
            role_specific_info = {
                'Major': user_info[8],
                'Current_degree': user_info[9]
            }
        elif role == 'tutor':
            role_specific_info = {
                'Name': user_info[10],
                'Academic_Rank': user_info[11],
                'Details': user_info[12],
                'Department_Name': user_info[13],
                'Issuance_Date': str(user_info[14]) if user_info[14] else None
            }
        elif role == 'admin':
            role_specific_info = {
                'Type': user_info[15]
            }
        
        # Get courses/assessments for students
        courses = []
        if role == 'student':
            cursor.execute('EXEC GetUserCourses %s', (university_id,))
            assessments = cursor.fetchall()
            
            for assessment in assessments:
                courses.append({
                    'Course_ID': assessment[0],
                    'Section_ID': assessment[1],
                    'Semester': assessment[2],
                    'Course_Name': assessment[3],
                    'Credit': int(assessment[4]) if assessment[4] else None,
                    'Registration_Date': str(assessment[5]) if assessment[5] else None,
                    'Status': assessment[6],
                    'Final_Grade': float(assessment[7]) if assessment[7] else None,
                    'Midterm_Grade': float(assessment[8]) if assessment[8] else None,
                    'Quiz_Grade': float(assessment[9]) if assessment[9] else None,
                    'Assignment_Grade': float(assessment[10]) if assessment[10] else None,
                })
        
        # Get sections taught for tutors
        sections_taught = []
        if role == 'tutor':
            cursor.execute('EXEC GetUserSectionsTaught %s', (university_id,))
            sections = cursor.fetchall()
            
            for section in sections:
                sections_taught.append({
                    'Course_ID': section[0],
                    'Section_ID': section[1],
                    'Semester': section[2],
                    'Course_Name': section[3],
                    'Start_Date': str(section[4]) if section[4] else None,
                    'Role_Specification': section[5] if len(section) > 5 else None,
                    'Timestamp': str(section[6]) if len(section) > 6 and section[6] else None,
                })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'University_ID': user_info[0],
                'First_Name': user_info[1],
                'Last_Name': user_info[2],
                'Email': user_info[3],
                'Phone_Number': user_info[4],
                'Address': user_info[5],
                'National_ID': user_info[6],
                'role': role,
                'role_specific_info': role_specific_info,
                'courses': courses if role == 'student' else [],
                'sections_taught': sections_taught if role == 'tutor' else [],
            }
        })
    except Exception as e:
        print(f'Get user details error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get user details: {str(e)}'}), 500

# ==================== AUDIT LOG MANAGEMENT ====================

@admin_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with filters - Using stored procedure"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        university_id = request.args.get('university_id', None, type=int)
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 50, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetAllAuditLogs %s, %s, %s, %s, %s', (
            start_date,
            end_date,
            university_id,
            page,
            page_size
        ))
        
        logs = cursor.fetchall()
        
        # Get total count (second result set)
        cursor.nextset()
        total_result = cursor.fetchone()
        total_count = total_result[0] if total_result else 0
        
        conn.close()
        
        result = []
        for log in logs:
            # Tuple: LogID, timestamp, affected_entities, section_creation, deadline_extensions, grade_updates, University_ID, First_Name, Last_Name, Email, User_Role
            result.append({
                'LogID': log[0],
                'timestamp': str(log[1]) if log[1] else None,
                'affected_entities': log[2],
                'section_creation': log[3],
                'deadline_extensions': log[4],
                'grade_updates': log[5],
                'University_ID': log[6],
                'First_Name': log[7],
                'Last_Name': log[8],
                'Email': log[9],
                'User_Role': log[10],
            })
        
        return jsonify({
            'logs': result,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size if page_size > 0 else 0
        })
    except Exception as e:
        print(f'Get audit logs error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get audit logs: {str(e)}'}), 500

@admin_bp.route('/audit-logs/<int:university_id>', methods=['GET'])
def get_audit_logs_by_user(university_id):
    """Get audit logs for a specific user - Using stored procedure"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 50, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetAuditLogsByUser %s, %s, %s, %s, %s', (
            university_id,
            start_date,
            end_date,
            page,
            page_size
        ))
        
        logs = cursor.fetchall()
        
        # Get total count (second result set)
        cursor.nextset()
        total_result = cursor.fetchone()
        total_count = total_result[0] if total_result else 0
        
        conn.close()
        
        result = []
        for log in logs:
            # Tuple: LogID, timestamp, affected_entities, section_creation, deadline_extensions, grade_updates, University_ID, First_Name, Last_Name, Email, User_Role
            result.append({
                'LogID': log[0],
                'timestamp': str(log[1]) if log[1] else None,
                'affected_entities': log[2],
                'section_creation': log[3],
                'deadline_extensions': log[4],
                'grade_updates': log[5],
                'University_ID': log[6],
                'First_Name': log[7],
                'Last_Name': log[8],
                'Email': log[9],
                'User_Role': log[10],
            })
        
        return jsonify({
            'logs': result,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size if page_size > 0 else 0
        })
    except Exception as e:
        print(f'Get audit logs by user error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get audit logs: {str(e)}'}), 500

@admin_bp.route('/audit-logs/statistics', methods=['GET'])
def get_audit_log_statistics():
    """Get audit log statistics - Using stored procedure"""
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetAuditLogStatistics %s, %s', (
            start_date,
            end_date
        ))
        
        stats = cursor.fetchone()
        conn.close()
        
        # Tuple: total_logs, unique_users, section_creations, deadline_extensions, grade_updates, entity_changes
        result = {
            'total_logs': int(stats[0]) if stats[0] else 0,
            'unique_users': int(stats[1]) if stats[1] else 0,
            'section_creations': int(stats[2]) if stats[2] else 0,
            'deadline_extensions': int(stats[3]) if stats[3] else 0,
            'grade_updates': int(stats[4]) if stats[4] else 0,
            'entity_changes': int(stats[5]) if stats[5] else 0,
        }
        
        return jsonify(result)
    except Exception as e:
        print(f'Get audit log statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get audit log statistics: {str(e)}'}), 500

# ==================== ADVANCED STATISTICS & ANALYTICS ====================

@admin_bp.route('/statistics/gpa-by-major', methods=['GET'])
def get_gpa_statistics_by_major():
    """Get GPA statistics grouped by major - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetGPAStatisticsByMajor')
        results = cursor.fetchall()
        conn.close()
        
        stats = []
        for row in results:
            stats.append({
                'Major': row[0],
                'StudentCount': int(row[1]) if row[1] else 0,
                'AverageGPA': float(row[2]) if row[2] else 0,
                'MinGPA': float(row[3]) if row[3] else 0,
                'MaxGPA': float(row[4]) if row[4] else 0,
                'StdDevGPA': float(row[5]) if row[5] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get GPA statistics by major error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get GPA statistics: {str(e)}'}), 500

@admin_bp.route('/statistics/gpa-by-department', methods=['GET'])
def get_gpa_statistics_by_department():
    """Get GPA statistics grouped by department - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetGPAStatisticsByDepartment')
        results = cursor.fetchall()
        conn.close()
        
        stats = []
        for row in results:
            stats.append({
                'Department_Name': row[0],
                'StudentCount': int(row[1]) if row[1] else 0,
                'AverageGPA': float(row[2]) if row[2] else 0,
                'MinGPA': float(row[3]) if row[3] else 0,
                'MaxGPA': float(row[4]) if row[4] else 0,
                'StdDevGPA': float(row[5]) if row[5] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get GPA statistics by department error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get GPA statistics: {str(e)}'}), 500

@admin_bp.route('/statistics/course-enrollment', methods=['GET'])
def get_course_enrollment_statistics():
    """Get course enrollment statistics - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseEnrollmentStatistics')
        results = cursor.fetchall()
        conn.close()
        
        stats = []
        for row in results:
            stats.append({
                'Major': row[0],
                'TotalStudents': int(row[1]) if row[1] else 0,
                'TotalCourses': int(row[2]) if row[2] else 0,
                'TotalEnrollments': int(row[3]) if row[3] else 0,
                'AvgCoursesPerStudent': float(row[4]) if row[4] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course enrollment statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get enrollment statistics: {str(e)}'}), 500

@admin_bp.route('/statistics/completion-rates', methods=['GET'])
def get_completion_rate_statistics():
    """Get completion rate statistics for quizzes and assignments - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCompletionRateStatistics')
        results = cursor.fetchall()
        conn.close()
        
        stats = []
        for row in results:
            stats.append({
                'Type': row[0],
                'Total': int(row[1]) if row[1] else 0,
                'Completed': int(row[2]) if row[2] else 0,
                'Passed': int(row[3]) if row[3] else 0,
                'CompletionRate': float(row[4]) if row[4] else 0,
                'PassRate': float(row[5]) if row[5] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get completion rate statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get completion rate statistics: {str(e)}'}), 500

@admin_bp.route('/statistics/performance-over-time', methods=['GET'])
def get_performance_over_time():
    """Get performance statistics over time - Using stored procedure"""
    try:
        group_by = request.args.get('group_by', 'Semester')  # 'Semester' or 'Month'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetPerformanceOverTime %s', (group_by,))
        results = cursor.fetchall()
        conn.close()
        
        stats = []
        for row in results:
            stats.append({
                'Period': row[0],
                'StudentCount': int(row[1]) if row[1] else 0,
                'CourseCount': int(row[2]) if row[2] else 0,
                'AverageGPA': float(row[3]) if row[3] else 0,
                'MinGPA': float(row[4]) if row[4] else 0,
                'MaxGPA': float(row[5]) if row[5] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get performance over time error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get performance statistics: {str(e)}'}), 500

@admin_bp.route('/statistics/top-students', methods=['GET'])
def get_top_students():
    """Get top students by GPA - Using stored procedure"""
    try:
        top_n = request.args.get('top_n', 10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetTopStudents %s', (top_n,))
        results = cursor.fetchall()
        conn.close()
        
        students = []
        for row in results:
            students.append({
                'University_ID': int(row[0]),
                'First_Name': row[1],
                'Last_Name': row[2],
                'Major': row[3],
                'CumulativeGPA': float(row[4]) if row[4] else 0,
                'CourseCount': int(row[5]) if row[5] else 0,
                'TotalCredits': float(row[6]) if row[6] else 0,
            })
        
        return jsonify(students)
    except Exception as e:
        print(f'Get top students error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get top students: {str(e)}'}), 500

@admin_bp.route('/statistics/top-tutors', methods=['GET'])
def get_top_tutors():
    """Get top tutors by student count and average GPA - Using stored procedure"""
    try:
        top_n = request.args.get('top_n', 10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetTopTutors %s', (top_n,))
        results = cursor.fetchall()
        conn.close()
        
        tutors = []
        for row in results:
            tutors.append({
                'University_ID': int(row[0]),
                'First_Name': row[1],
                'Last_Name': row[2],
                'Department_Name': row[3],
                'Academic_Rank': row[4],
                'SectionCount': int(row[5]) if row[5] else 0,
                'StudentCount': int(row[6]) if row[6] else 0,
                'AverageStudentGPA': float(row[7]) if row[7] else 0,
            })
        
        return jsonify(tutors)
    except Exception as e:
        print(f'Get top tutors error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get top tutors: {str(e)}'}), 500

# ==================== COURSE STATISTICS & ANALYTICS ====================

@admin_bp.route('/statistics/courses/enrollment-by-course', methods=['GET'])
def get_course_enrollment_by_course():
    """Get enrollment statistics by course - Using stored procedure"""
    start_time = time.time()
    try:
        top_n = request.args.get('top_n', type=int)
        print(f'[Backend] get_course_enrollment_by_course called with top_n={top_n}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if top_n:
            cursor.execute('EXEC GetCourseEnrollmentByCourse %s', (top_n,))
        else:
            cursor.execute('EXEC GetCourseEnrollmentByCourse %s', (None,))
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_enrollment_by_course completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Course_ID': row[0],
                'Course_Name': row[1],
                'Credit': int(row[2]) if row[2] is not None else None,
                'SectionCount': int(row[3]) if row[3] else 0,
                'StudentCount': int(row[4]) if row[4] else 0,
                'TutorCount': int(row[5]) if row[5] else 0,
                'AverageGrade': float(row[6]) if row[6] else None,
                'ApprovedStudents': int(row[7]) if row[7] else 0,
                'PendingStudents': int(row[8]) if row[8] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course enrollment by course error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get course enrollment: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/distribution-by-credit', methods=['GET'])
def get_course_distribution_by_credit():
    """Get course distribution by credit value - Using stored procedure"""
    start_time = time.time()
    try:
        print('[Backend] get_course_distribution_by_credit called')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseDistributionByCredit')
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_distribution_by_credit completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Credit': int(row[0]) if row[0] is not None else 0,
                'CourseCount': int(row[1]) if row[1] else 0,
                'TotalStudents': int(row[2]) if row[2] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course distribution by credit error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get course distribution: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/top-by-enrollment', methods=['GET'])
def get_top_courses_by_enrollment():
    """Get top courses by enrollment - Using stored procedure"""
    start_time = time.time()
    try:
        top_n = request.args.get('top_n', 10, type=int)
        print(f'[Backend] get_top_courses_by_enrollment called with top_n={top_n}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetTopCoursesByEnrollment %s', (top_n,))
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_top_courses_by_enrollment completed in {elapsed:.2f}s, returned {len(results)} results')
        
        courses = []
        for row in results:
            courses.append({
                'Course_ID': row[0],
                'Course_Name': row[1],
                'Credit': int(row[2]) if row[2] is not None else None,
                'StudentCount': int(row[3]) if row[3] else 0,
                'SectionCount': int(row[4]) if row[4] else 0,
                'TutorCount': int(row[5]) if row[5] else 0,
                'AverageGrade': float(row[6]) if row[6] else None,
                'MinGrade': float(row[7]) if row[7] else None,
                'MaxGrade': float(row[8]) if row[8] else None,
            })
        
        return jsonify(courses)
    except Exception as e:
        print(f'Get top courses by enrollment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get top courses: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/average-grade', methods=['GET'])
def get_course_average_grade():
    """Get average grade statistics by course - Using stored procedure"""
    start_time = time.time()
    try:
        min_enrollment = request.args.get('min_enrollment', 1, type=int)
        print(f'[Backend] get_course_average_grade called with min_enrollment={min_enrollment}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseAverageGradeByCourse %s', (min_enrollment,))
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_average_grade completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Course_ID': row[0],
                'Course_Name': row[1],
                'Credit': int(row[2]) if row[2] is not None else None,
                'StudentCount': int(row[3]) if row[3] else 0,
                'AverageGPA': float(row[4]) if row[4] else None,
                'AverageFinalGrade': float(row[5]) if row[5] else None,
                'MinFinalGrade': float(row[6]) if row[6] else None,
                'MaxFinalGrade': float(row[7]) if row[7] else None,
                'StdDevFinalGrade': float(row[8]) if row[8] else None,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course average grade error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get course average grade: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/enrollment-trend', methods=['GET'])
def get_course_enrollment_trend_over_time():
    """Get course enrollment trend over time - Using stored procedure"""
    start_time = time.time()
    try:
        group_by = request.args.get('group_by', 'Semester')  # 'Semester' or 'Month'
        print(f'[Backend] get_course_enrollment_trend_over_time called with group_by={group_by}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseEnrollmentTrendOverTime %s', (group_by,))
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_enrollment_trend_over_time completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Period': row[0],
                'CourseCount': int(row[1]) if row[1] else 0,
                'SectionCount': int(row[2]) if row[2] else 0,
                'StudentCount': int(row[3]) if row[3] else 0,
                'TutorCount': int(row[4]) if row[4] else 0,
                'AverageGrade': float(row[5]) if row[5] else None,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course enrollment trend error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get enrollment trend: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/status-distribution', methods=['GET'])
def get_course_status_distribution():
    """Get course enrollment status distribution - Using stored procedure"""
    start_time = time.time()
    try:
        print('[Backend] get_course_status_distribution called')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC GetCourseStatusDistribution')
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_status_distribution completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Status': row[0],
                'StudentCount': int(row[1]) if row[1] else 0,
                'CourseCount': int(row[2]) if row[2] else 0,
                'SectionCount': int(row[3]) if row[3] else 0,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course status distribution error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get status distribution: {str(e)}'}), 500

@admin_bp.route('/statistics/courses/activity', methods=['GET'])
def get_course_activity_statistics():
    """Get course activity statistics (assignments, quizzes, submissions) - Using stored procedure"""
    start_time = time.time()
    try:
        top_n = request.args.get('top_n', type=int)
        print(f'[Backend] get_course_activity_statistics called with top_n={top_n}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if top_n:
            cursor.execute('EXEC GetCourseActivityStatistics %s', (top_n,))
        else:
            cursor.execute('EXEC GetCourseActivityStatistics %s', (None,))
        results = cursor.fetchall()
        conn.close()
        
        elapsed = time.time() - start_time
        print(f'[Backend] get_course_activity_statistics completed in {elapsed:.2f}s, returned {len(results)} results')
        
        stats = []
        for row in results:
            stats.append({
                'Course_ID': row[0],
                'Course_Name': row[1],
                'Credit': int(row[2]) if row[2] is not None else None,
                'SectionCount': int(row[3]) if row[3] else 0,
                'StudentCount': int(row[4]) if row[4] else 0,
                'TotalAssignments': int(row[5]) if row[5] else 0,
                'TotalQuizzes': int(row[6]) if row[6] else 0,
                'TotalSubmissions': int(row[7]) if row[7] else 0,
                'SubmittedCount': int(row[8]) if row[8] else 0,
                'AverageGrade': float(row[9]) if row[9] else None,
            })
        
        return jsonify(stats)
    except Exception as e:
        print(f'Get course activity statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get course activity: {str(e)}'}), 500

