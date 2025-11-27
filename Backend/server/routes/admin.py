from flask import Blueprint, request, jsonify
from config.database import get_db_connection
from utils.jwt_utils import require_auth, require_role
import bcrypt
import time

admin_bp = Blueprint('admin', __name__)

# ==================== COURSES MANAGEMENT ====================

@admin_bp.route('/courses', methods=['GET'])
@require_auth
@require_role(['admin'])
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
            # Tuple access: Course_ID, Name, Credit, CCategory, SectionCount, StudentCount, TutorCount
            result.append({
                'Course_ID': course[0],
                'Name': course[1],
                'Credit': course[2] if course[2] is not None else None,
                'CCategory': course[3] if len(course) > 3 and course[3] is not None else None,
                'SectionCount': int(course[4]) if len(course) > 4 and course[4] is not None else 0,
                'StudentCount': int(course[5]) if len(course) > 5 and course[5] is not None else 0,
                'TutorCount': int(course[6]) if len(course) > 6 and course[6] is not None else 0,
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all courses error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch courses'}), 500

@admin_bp.route('/courses/preview-sections', methods=['GET'])
@require_auth
@require_role(['admin'])
def preview_section_ids():
    """Preview section IDs that will be created based on counts - Using stored procedure sp_GetSectionIDsByCount"""
    try:
        cc_count = request.args.get('cc_count', type=int, default=0)
        l_count = request.args.get('l_count', type=int, default=0)
        kstn_count = request.args.get('kstn_count', type=int, default=0)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC sp_GetSectionIDsByCount %s, %s, %s', (
            cc_count,
            l_count,
            kstn_count
        ))
        
        sections = cursor.fetchall()
        conn.close()
        
        result = [section[0] for section in sections]  # Extract Section_ID from each row
        return jsonify(result)
    except Exception as e:
        print(f'Preview section IDs error: {e}')
        return jsonify({'success': False, 'error': f'Failed to preview section IDs: {str(e)}'}), 500

@admin_bp.route('/courses/with-sections', methods=['POST'])
@require_auth
@require_role(['admin'])
def create_course_with_sections():
    """Create a new course with sections - Using stored procedure sp_CreateCourseWithSections"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Call sp_CreateCourseWithSections
        cursor.execute('EXEC sp_CreateCourseWithSections %s, %s, %s, %s, %s, %s, %s', (
            data['Course_ID'],
            data['Name'],
            data.get('Credit'),
            data.get('Semester', '242'),  # Default semester
            data.get('CC_Count', 0),
            data.get('L_Count', 0),
            data.get('KSTN_Count', 0)
        ))

        sections = cursor.fetchall()  # Get created sections
        conn.commit()
        
        # If CCategory is provided, update the course
        if data.get('CCategory'):
            cursor.execute('EXEC UpdateCourse %s, %s, %s, %s', (
                data['Course_ID'],
                None,  # Name - keep existing
                None,  # Credit - keep existing
                data.get('CCategory')
            ))
            conn.commit()
        
        # Get the created course
        cursor.execute('SELECT Course_ID, Name, Credit, CCategory FROM [Course] WHERE Course_ID = %s', (data['Course_ID'],))
        course_result = cursor.fetchone()
        
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Course with sections created successfully',
            'course': {
                'Course_ID': course_result[0],
                'Name': course_result[1],
                'Credit': course_result[2],
                'CCategory': course_result[3] if len(course_result) > 3 else None,
            },
            'sections': [
                {
                    'Section_ID': section[0],
                    'Prefix': section[1],
                    'Number': section[2],
                    'Course_ID': section[3],
                    'Semester': section[4]
                }
                for section in sections
            ]
        }), 201
    except Exception as e:
        print(f'Create course with sections error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create course with sections: {str(e)}'}), 500

@admin_bp.route('/courses', methods=['POST'])
@require_auth
@require_role(['admin'])
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
            data.get('CCategory')
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
                'CCategory': result[3] if len(result) > 3 else None,
            }
        }), 201
    except Exception as e:
        print(f'Create course error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create course: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>', methods=['PUT'])
@require_auth
@require_role(['admin'])
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
            data.get('CCategory')
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
                'CCategory': result[3] if len(result) > 3 else None,
            }
        })
    except Exception as e:
        print(f'Update course error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update course: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>', methods=['DELETE'])
@require_auth
@require_role(['admin'])
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

@admin_bp.route('/categories', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_all_categories():
    """Get all distinct categories from courses - Using stored procedure GetAllCategories"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllCategories')
        categories = cursor.fetchall()
        conn.close()
        
        result = [category[0] for category in categories if category[0]]
        return jsonify(result)
    except Exception as e:
        print(f'Get all categories error: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch categories'}), 500

@admin_bp.route('/courses/search', methods=['GET'])
@require_auth
@require_role(['admin'])
def search_courses():
    """Search courses with advanced filters - Using stored procedure"""
    start_time = time.time()
    try:
        search_query = request.args.get('search', None)
        min_credit = request.args.get('min_credit', type=int)
        max_credit = request.args.get('max_credit', type=int)
        has_sections = request.args.get('has_sections', type=lambda x: x.lower() == 'true' if x else None)
        has_students = request.args.get('has_students', type=lambda x: x.lower() == 'true' if x else None)
        
        print(f'[Backend] search_courses called with filters: search={search_query}, min_credit={min_credit}, max_credit={max_credit}')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC SearchCourses %s, %s, %s, %s, %s', (
            search_query,
            min_credit,
            max_credit,
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
                'SectionCount': course[3] if len(course) > 3 else 0,
                'StudentCount': course[4] if len(course) > 4 else 0,
                'TutorCount': course[5] if len(course) > 5 else 0,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Search courses error: {e}')
        return jsonify({'success': False, 'error': f'Failed to search courses: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/details', methods=['GET'])
@require_auth
@require_role(['admin'])
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
            'TotalSections': result[3] if len(result) > 3 else 0,
            'TotalStudents': result[4] if len(result) > 4 else 0,
            'TotalTutors': result[5] if len(result) > 5 else 0,
            'TotalAssignments': result[6] if len(result) > 6 else 0,
            'TotalQuizzes': result[7] if len(result) > 7 else 0,
            'AverageFinalGrade': float(result[8]) if len(result) > 8 and result[8] else None,
        })
    except Exception as e:
        print(f'Get course details error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get course details: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/sections', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
                'SectionCount': course[3] if len(course) > 3 else 0,
                'StudentCount': course[4] if len(course) > 4 else 0,
            })
        
        return jsonify(result)
    except Exception as e:
        print(f'Get courses by semester error: {e}')
        return jsonify({'success': False, 'error': f'Failed to get courses by semester: {str(e)}'}), 500

@admin_bp.route('/courses/<string:course_id>/enrollment-trend', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
def get_all_assignments():
    """Get all assignments - Using stored procedure"""
    try:
        print('[Backend] get_all_assignments called')
        conn = get_db_connection()
        cursor = conn.cursor()
        print('[Backend] Executing GetAllAssignments procedure...')
        cursor.execute('EXEC GetAllAssignments')
        assignments = cursor.fetchall()
        print(f'[Backend] GetAllAssignments returned {len(assignments)} assignments')
        conn.close()

        result = []
        for assignment in assignments:
            try:
                # Tuple access: AssignmentID, Course_ID, Semester, MaxScore, accepted_specification, submission_deadline, instructions, Course_Name, StudentCount
                result.append({
                    'AssignmentID': assignment[0],
                    'Course_ID': assignment[1],
                    'Semester': assignment[2],
                    'MaxScore': assignment[3],
                    'accepted_specification': assignment[4],
                    'submission_deadline': str(assignment[5]) if assignment[5] else None,
                    'instructions': assignment[6],
                    'Course_Name': assignment[7] if len(assignment) > 7 else None,
                    'StudentCount': assignment[8] if len(assignment) > 8 else 0,
                })
            except Exception as parse_error:
                print(f'[Backend] Error parsing assignment: {parse_error}, assignment data: {assignment}')
                continue

        print(f'[Backend] Returning {len(result)} assignments')
        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get all assignments error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch assignments: {str(e)}'}), 500

@admin_bp.route('/assignments/by-course', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_assignments_by_course():
    """Get assignments grouped by course - Using stored procedure"""
    try:
        course_id = request.args.get('course_id', None)
        print(f'[Backend] get_assignments_by_course called with course_id={course_id}')
        conn = get_db_connection()
        cursor = conn.cursor()
        print('[Backend] Executing GetAssignmentsByCourse procedure...')
        if course_id:
            cursor.execute('EXEC GetAssignmentsByCourse %s', (course_id,))
        else:
            cursor.execute('EXEC GetAssignmentsByCourse NULL')
        assignments = cursor.fetchall()
        print(f'[Backend] GetAssignmentsByCourse returned {len(assignments)} assignments')
        conn.close()

        result = []
        for assignment in assignments:
            try:
                # Tuple access: AssignmentID, Course_ID, Semester, MaxScore, accepted_specification, submission_deadline, instructions, Course_Name, StudentCount
                result.append({
                    'AssignmentID': assignment[0],
                    'Course_ID': assignment[1],
                    'Semester': assignment[2],
                    'MaxScore': assignment[3],
                    'accepted_specification': assignment[4],
                    'submission_deadline': str(assignment[5]) if assignment[5] else None,
                    'instructions': assignment[6],
                    'Course_Name': assignment[7] if len(assignment) > 7 else None,
                    'StudentCount': assignment[8] if len(assignment) > 8 else 0,
                })
            except Exception as parse_error:
                print(f'[Backend] Error parsing assignment: {parse_error}, assignment data: {assignment}')
                continue

        print(f'[Backend] Returning {len(result)} assignments')
        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get assignments by course error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch assignments: {str(e)}'}), 500

@admin_bp.route('/assignments', methods=['POST'])
@require_auth
@require_role(['admin'])
def create_assignment():
    """Create a new assignment - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Parse submission_deadline if provided
        submission_deadline = None
        if data.get('submission_deadline'):
            try:
                # Handle datetime-local format (YYYY-MM-DDTHH:mm)
                deadline_str = data.get('submission_deadline')
                if 'T' in deadline_str:
                    deadline_str = deadline_str.replace('T', ' ')
                    if len(deadline_str) == 16:  # YYYY-MM-DD HH:mm
                        deadline_str += ':00'  # Add seconds
                submission_deadline = deadline_str
            except Exception as e:
                print(f'Error parsing submission_deadline: {e}')
                submission_deadline = data.get('submission_deadline')
        
        # Call stored procedure (no Section_ID needed)
        cursor.execute('EXEC CreateAssignment %s, %s, %s, %s, %s, %s', (
            data['Course_ID'],
            data['Semester'],
            data.get('MaxScore', 10),
            data.get('accepted_specification'),
            submission_deadline,
            data.get('instructions')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assignment created successfully',
            'assignment': {
                'AssignmentID': result[0],
                'Course_ID': result[1],
                'Semester': result[2],
                'MaxScore': result[3],
                'accepted_specification': result[4],
                'submission_deadline': str(result[5]) if result[5] else None,
                'instructions': result[6],
                'Course_Name': result[7] if len(result) > 7 else None,
                'StudentCount': result[8] if len(result) > 8 else 0,
            }
        }), 201
    except Exception as e:
        print(f'Create assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to create assignment: {str(e)}'}), 500

@admin_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
@require_auth
@require_role(['admin'])
def update_assignment(assignment_id):
    """Update an assignment - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Parse submission_deadline if provided
        submission_deadline = None
        if data.get('submission_deadline'):
            try:
                # Handle datetime-local format (YYYY-MM-DDTHH:mm)
                deadline_str = data.get('submission_deadline')
                if 'T' in deadline_str:
                    deadline_str = deadline_str.replace('T', ' ')
                    if len(deadline_str) == 16:  # YYYY-MM-DD HH:mm
                        deadline_str += ':00'  # Add seconds
                submission_deadline = deadline_str
            except Exception as e:
                print(f'Error parsing submission_deadline: {e}')
                submission_deadline = data.get('submission_deadline')

        cursor.execute('EXEC UpdateAssignment %s, %s, %s, %s, %s, %s, %s', (
            assignment_id,
            data.get('Course_ID'),
            data.get('Semester'),
            data.get('MaxScore'),
            data.get('accepted_specification'),
            submission_deadline,
            data.get('instructions')
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assignment updated successfully',
            'assignment': {
                'AssignmentID': result[0],
                'Course_ID': result[1],
                'Semester': result[2],
                'MaxScore': result[3],
                'accepted_specification': result[4],
                'submission_deadline': str(result[5]) if result[5] else None,
                'instructions': result[6],
                'Course_Name': result[7] if len(result) > 7 else None,
                'StudentCount': result[8] if len(result) > 8 else 0,
            }
        })
    except Exception as e:
        print(f'Update assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update assignment: {str(e)}'}), 500

@admin_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@require_auth
@require_role(['admin'])
def delete_assignment(assignment_id):
    """Delete an assignment - Using stored procedure (deletes Assignment_Definition and cascades to Assignment_Submission)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteAssignment %s', (assignment_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Assignment deleted successfully'})
    except Exception as e:
        print(f'Delete assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to delete assignment: {str(e)}'}), 500

@admin_bp.route('/assignments/<int:assignment_id>/submissions', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_assignment_submissions(assignment_id):
    """Get all assignment submissions for a specific assignment"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAssignmentSubmissionsByAssignmentID %s', (assignment_id,))
        submissions = cursor.fetchall()
        conn.close()

        result = []
        for submission in submissions:
            try:
                # Tuple access: University_ID, First_Name, Last_Name, AssignmentID, Assessment_ID, score, accepted_specification, late_flag_indicator, SubmitDate, attached_files, status, Comments, Assignment_Instructions, MaxScore, submission_deadline
                result.append({
                    'University_ID': submission[0],
                    'First_Name': submission[1],
                    'Last_Name': submission[2],
                    'AssignmentID': submission[3],
                    'Assessment_ID': submission[4],
                    'score': float(submission[5]) if submission[5] is not None else None,
                    'accepted_specification': submission[6],
                    'late_flag_indicator': bool(submission[7]) if submission[7] is not None else False,
                    'SubmitDate': str(submission[8]) if submission[8] else None,
                    'attached_files': submission[9],
                    'status': submission[10],
                    'Comments': submission[11] if len(submission) > 11 else None,
                    'Assignment_Instructions': submission[12] if len(submission) > 12 else None,
                    'MaxScore': submission[13] if len(submission) > 13 else None,
                    'submission_deadline': str(submission[14]) if len(submission) > 14 and submission[14] else None,
                })
            except Exception as parse_error:
                print(f'[Backend] Error parsing submission: {parse_error}, submission data: {submission}')
                continue

        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get assignment submissions error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch assignment submissions: {str(e)}'}), 500

# ==================== QUIZZES MANAGEMENT ====================

@admin_bp.route('/quizzes', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_all_quizzes():
    """Get all quizzes - Using stored procedure"""
    try:
        print('[Backend] get_all_quizzes called')
        conn = get_db_connection()
        cursor = conn.cursor()
        print('[Backend] Executing GetAllQuizzes procedure...')
        cursor.execute('EXEC GetAllQuizzes')
        quizzes = cursor.fetchall()
        print(f'[Backend] GetAllQuizzes returned {len(quizzes)} quizzes')
        conn.close()

        result = []
        for quiz in quizzes:
            try:
                # Tuple access: QuizID, Section_ID, Course_ID, Semester, Grading_method, pass_score, Time_limits, Start_Date, End_Date, content, types, Weight, Correct_answer, Questions, Course_Name, StudentCount
                result.append({
                    'QuizID': quiz[0],
                    'Section_ID': quiz[1],
                    'Course_ID': quiz[2],
                    'Semester': quiz[3],
                    'Grading_method': quiz[4],
                    'pass_score': float(quiz[5]) if quiz[5] else None,
                    'Time_limits': str(quiz[6]) if quiz[6] else None,
                    'Start_Date': str(quiz[7]) if quiz[7] else None,
                    'End_Date': str(quiz[8]) if quiz[8] else None,
                    'content': quiz[9],
                    'types': quiz[10],
                    'Weight': float(quiz[11]) if quiz[11] else None,
                    'Correct_answer': quiz[12],
                    'Questions': quiz[13] if len(quiz) > 13 else None,
                    'Course_Name': quiz[14] if len(quiz) > 14 else None,
                    'StudentCount': quiz[15] if len(quiz) > 15 else 0,
                })
            except Exception as parse_error:
                print(f'[Backend] Error parsing quiz: {parse_error}, quiz data: {quiz}')
                continue

        print(f'[Backend] Returning {len(result)} quizzes')
        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get all quizzes error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch quizzes: {str(e)}'}), 500

@admin_bp.route('/quizzes/by-course', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_quizzes_by_course():
    """Get quizzes grouped by course - Using stored procedure"""
    try:
        course_id = request.args.get('course_id', None)
        print(f'[Backend] get_quizzes_by_course called with course_id={course_id}')
        conn = get_db_connection()
        cursor = conn.cursor()
        print('[Backend] Executing GetQuizzesByCourse procedure...')
        if course_id:
            cursor.execute('EXEC GetQuizzesByCourse %s', (course_id,))
        else:
            cursor.execute('EXEC GetQuizzesByCourse NULL')
        quizzes = cursor.fetchall()
        print(f'[Backend] GetQuizzesByCourse returned {len(quizzes)} quizzes')
        conn.close()

        result = []
        for quiz in quizzes:
            try:
                # Tuple access: QuizID, Section_ID, Course_ID, Semester, Grading_method, pass_score, Time_limits, Start_Date, End_Date, content, types, Weight, Correct_answer, Questions, Course_Name, StudentCount
                result.append({
                    'QuizID': quiz[0],
                    'Section_ID': quiz[1],
                    'Course_ID': quiz[2],
                    'Semester': quiz[3],
                    'Grading_method': quiz[4],
                    'pass_score': float(quiz[5]) if quiz[5] else None,
                    'Time_limits': str(quiz[6]) if quiz[6] else None,
                    'Start_Date': str(quiz[7]) if quiz[7] else None,
                    'End_Date': str(quiz[8]) if quiz[8] else None,
                    'content': quiz[9],
                    'types': quiz[10],
                    'Weight': float(quiz[11]) if quiz[11] else None,
                    'Correct_answer': quiz[12],
                    'Questions': quiz[13] if len(quiz) > 13 else None,
                    'Course_Name': quiz[14] if len(quiz) > 14 else None,
                    'StudentCount': quiz[15] if len(quiz) > 15 else 0,
                })
            except Exception as parse_error:
                print(f'[Backend] Error parsing quiz: {parse_error}, quiz data: {quiz}')
                continue

        print(f'[Backend] Returning {len(result)} quizzes')
        return jsonify(result)
    except Exception as e:
        print(f'[Backend] Get quizzes by course error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch quizzes: {str(e)}'}), 500

@admin_bp.route('/quizzes', methods=['POST'])
@require_auth
@require_role(['admin'])
def create_quiz():
    """Create a new quiz - Using stored procedure (creates Quiz_Questions)"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Convert Questions array to JSON string if provided
        questions_json = None
        if data.get('Questions'):
            import json
            questions_json = json.dumps(data['Questions'], ensure_ascii=False)
        
        # Convert datetime strings to proper format
        from datetime import datetime
        start_date = None
        end_date = None
        
        if data.get('Start_Date'):
            try:
                start_date_str = data.get('Start_Date').strip()
                if start_date_str:
                    # Handle datetime-local format: "YYYY-MM-DDTHH:mm"
                    if 'T' in start_date_str:
                        start_date_str = start_date_str.replace('T', ' ')
                    if len(start_date_str) == 16:  # "YYYY-MM-DD HH:mm"
                        start_date_str += ':00'  # Add seconds
                    start_date = start_date_str
            except Exception as e:
                print(f'Error parsing Start_Date: {e}')
                start_date = None
        
        if data.get('End_Date'):
            try:
                end_date_str = data.get('End_Date').strip()
                if end_date_str:
                    # Handle datetime-local format: "YYYY-MM-DDTHH:mm"
                    if 'T' in end_date_str:
                        end_date_str = end_date_str.replace('T', ' ')
                    if len(end_date_str) == 16:  # "YYYY-MM-DD HH:mm"
                        end_date_str += ':00'  # Add seconds
                    end_date = end_date_str
            except Exception as e:
                print(f'Error parsing End_Date: {e}')
                end_date = None
        
        # Call stored procedure - QuizID is OUTPUT parameter
        cursor.execute('EXEC CreateQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            data['Section_ID'],
            data['Course_ID'],
            data['Semester'],
            data.get('Grading_method', 'Highest Attemp'),
            data.get('pass_score', 5),
            data['Time_limits'],
            start_date,
            end_date,
            data['content'],
            data.get('types'),
            data.get('Weight'),
            data['Correct_answer'],
            questions_json
        ))

        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Quiz created successfully',
            'quiz': {
                'QuizID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Grading_method': result[4],
                'pass_score': float(result[5]) if result[5] else None,
                'Time_limits': str(result[6]) if result[6] else None,
                'Start_Date': str(result[7]) if result[7] else None,
                'End_Date': str(result[8]) if result[8] else None,
                'content': result[9],
                'types': result[10],
                'Weight': float(result[11]) if result[11] else None,
                'Correct_answer': result[12],
                'Questions': result[13] if len(result) > 13 else None,
                'Course_Name': result[14] if len(result) > 14 else None,
                'StudentCount': result[15] if len(result) > 15 else 0,
            }
        }), 201
    except Exception as e:
        print(f'Create quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to create quiz: {str(e)}'}), 500

@admin_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@require_auth
@require_role(['admin'])
def update_quiz(quiz_id):
    """Update a quiz - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Convert Questions to JSON string if provided
        # Frontend sends JSON string directly, so we need to handle both string and object/array
        questions_json = None
        questions_data = data.get('Questions')
        print(f'[Backend] UpdateQuiz - Received Questions data: {questions_data}')
        print(f'[Backend] UpdateQuiz - Questions data type: {type(questions_data)}')
        print(f'[Backend] UpdateQuiz - Questions data is None: {questions_data is None}')
        
        if questions_data is not None:
            import json
            # If it's already a string (JSON), use it directly
            if isinstance(questions_data, str):
                questions_json = questions_data
                print(f'[Backend] UpdateQuiz - Questions is already JSON string, length: {len(questions_json)}')
            else:
                # If it's a list/dict, convert to JSON string
                questions_json = json.dumps(questions_data, ensure_ascii=False)
                print(f'[Backend] UpdateQuiz - Questions converted to JSON string, length: {len(questions_json)}')
            
            # Check for answer E in the JSON string
            if '"E"' in questions_json or "'E'" in questions_json:
                print(f'[Backend] UpdateQuiz - Answer E found in JSON string!')
            else:
                print(f'[Backend] UpdateQuiz - Answer E NOT found in JSON string!')
            
            if len(questions_json) < 500:
                print(f'[Backend] UpdateQuiz - Full Questions JSON: {questions_json}')
            else:
                print(f'[Backend] UpdateQuiz - Questions JSON preview: {questions_json[:500]}...')
        else:
            print(f'[Backend] UpdateQuiz - Questions data is None, will not update Questions column')
        
        # Convert datetime strings to proper format or None
        from datetime import datetime
        start_date = None
        end_date = None
        
        if data.get('Start_Date'):
            try:
                # Handle datetime-local format: "YYYY-MM-DDTHH:mm"
                start_date_str = data.get('Start_Date').strip()
                if start_date_str:
                    # Replace 'T' with space and add seconds if needed
                    if 'T' in start_date_str:
                        start_date_str = start_date_str.replace('T', ' ')
                    if len(start_date_str) == 16:  # "YYYY-MM-DD HH:mm"
                        start_date_str += ':00'  # Add seconds
                    start_date = start_date_str
            except Exception as e:
                print(f'Error parsing Start_Date: {e}')
                start_date = None
        
        if data.get('End_Date'):
            try:
                # Handle datetime-local format: "YYYY-MM-DDTHH:mm"
                end_date_str = data.get('End_Date').strip()
                if end_date_str:
                    # Replace 'T' with space and add seconds if needed
                    if 'T' in end_date_str:
                        end_date_str = end_date_str.replace('T', ' ')
                    if len(end_date_str) == 16:  # "YYYY-MM-DD HH:mm"
                        end_date_str += ':00'  # Add seconds
                    end_date = end_date_str
            except Exception as e:
                print(f'Error parsing End_Date: {e}')
                end_date = None
        
        # Log parameters before executing
        print(f'[Backend] UpdateQuiz - Executing with questions_json: {questions_json[:200] if questions_json and len(questions_json) > 200 else questions_json}')
        print(f'[Backend] UpdateQuiz - questions_json parameter type: {type(questions_json)}')
        print(f'[Backend] UpdateQuiz - questions_json is None: {questions_json is None}')
        print(f'[Backend] UpdateQuiz - questions_json length: {len(questions_json) if questions_json else 0}')
        
        # Check if "Test thay đổi answer" is in the JSON
        if questions_json and "Test thay đổi answer" in questions_json:
            print(f'[Backend] UpdateQuiz - "Test thay đổi answer" FOUND in questions_json before execution!')
        else:
            print(f'[Backend] UpdateQuiz - "Test thay đổi answer" NOT found in questions_json before execution!')

        # Execute procedure - pymssql uses positional parameters
        # Ensure questions_json is not None when we have data
        exec_params = (
            quiz_id,
            data.get('Section_ID'),
            data.get('Course_ID'),
            data.get('Semester'),
            data.get('Grading_method'),
            data.get('pass_score'),
            data.get('Time_limits'),
            start_date,
            end_date,
            data.get('content'),
            data.get('types'),
            data.get('Weight'),
            data.get('Correct_answer'),
            questions_json  # This should be the JSON string or None
        )
        
        print(f'[Backend] UpdateQuiz - Parameter 13 (Questions) type: {type(exec_params[13])}')
        print(f'[Backend] UpdateQuiz - Parameter 13 (Questions) is None: {exec_params[13] is None}')
        print(f'[Backend] UpdateQuiz - Parameter 13 (Questions) length: {len(exec_params[13]) if exec_params[13] else 0}')
        
        try:
            # First, update Questions directly if provided (to avoid pymssql NVARCHAR(MAX) issues)
            if questions_json is not None:
                print(f'[Backend] UpdateQuiz - Updating Questions directly with SQL...')
                cursor.execute('UPDATE [Quiz_Questions] SET Questions = %s WHERE QuizID = %s', (questions_json, quiz_id))
                rows_affected = cursor.rowcount
                print(f'[Backend] UpdateQuiz - Direct Questions UPDATE affected {rows_affected} rows')
                if rows_affected == 0:
                    print(f'[Backend] UpdateQuiz - WARNING: No rows updated for Questions! QuizID might not exist.')
            
            # Then update other fields using procedure
            cursor.execute('EXEC UpdateQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NULL', (
                quiz_id,
                data.get('Section_ID'),
                data.get('Course_ID'),
                data.get('Semester'),
                data.get('Grading_method'),
                data.get('pass_score'),
                data.get('Time_limits'),
                start_date,
                end_date,
            data.get('content'),
            data.get('types'),
            data.get('Weight'),
            data.get('Correct_answer')
        ))
        except Exception as exec_error:
            print(f'[Backend] UpdateQuiz - Error executing procedure: {exec_error}')
            import traceback
            traceback.print_exc()
            conn.rollback()
            conn.close()
            raise

        result = cursor.fetchone()
        conn.commit()
        
        # Log the saved Questions to verify
        # Tuple access: QuizID, Section_ID, Course_ID, Semester, Grading_method, pass_score, Time_limits, Start_Date, End_Date, content, types, Weight, Correct_answer, Questions, Course_Name, StudentCount
        saved_questions = result[13] if len(result) > 13 else None
        print(f'[Backend] UpdateQuiz - Saved Questions length: {len(saved_questions) if saved_questions else 0}')
        print(f'[Backend] UpdateQuiz - Saved Questions type: {type(saved_questions)}')
        print(f'[Backend] UpdateQuiz - Saved Questions is None: {saved_questions is None}')
        
        # Also query directly from database to verify
        cursor.execute('SELECT Questions FROM [Quiz_Questions] WHERE QuizID = %s', (quiz_id,))
        direct_result = cursor.fetchone()
        direct_questions = direct_result[0] if direct_result else None
        print(f'[Backend] UpdateQuiz - Direct query Questions length: {len(direct_questions) if direct_questions else 0}')
        if direct_questions and "Test thay đổi answer" in direct_questions:
            print(f'[Backend] UpdateQuiz - "Test thay đổi answer" FOUND in direct query!')
        else:
            print(f'[Backend] UpdateQuiz - "Test thay đổi answer" NOT found in direct query!')
            if direct_questions:
                print(f'[Backend] UpdateQuiz - Direct query Questions preview: {direct_questions[:300]}...')
        
        if saved_questions:
            # Check if answer E exists in saved data
            if '"E"' in saved_questions:
                print(f'[Backend] UpdateQuiz - Answer E found in saved Questions!')
            else:
                print(f'[Backend] UpdateQuiz - Answer E NOT found in saved Questions!')
            
            if len(saved_questions) < 500:
                print(f'[Backend] UpdateQuiz - Full Saved Questions JSON: {saved_questions}')
            else:
                print(f'[Backend] UpdateQuiz - Saved Questions preview: {saved_questions[:500]}...')
        else:
            print(f'[Backend] UpdateQuiz - No Questions saved (saved_questions is None)')
        
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Quiz updated successfully',
            'quiz': {
                'QuizID': result[0],
                'Section_ID': result[1],
                'Course_ID': result[2],
                'Semester': result[3],
                'Grading_method': result[4],
                'pass_score': float(result[5]) if result[5] else None,
                'Time_limits': str(result[6]) if result[6] else None,
                'Start_Date': str(result[7]) if result[7] else None,
                'End_Date': str(result[8]) if result[8] else None,
                'content': result[9],
                'types': result[10],
                'Weight': float(result[11]) if result[11] else None,
                'Correct_answer': result[12],
                'Questions': result[13] if len(result) > 13 else None,
                'Course_Name': result[14] if len(result) > 14 else None,
                'StudentCount': result[15] if len(result) > 15 else 0,
            }
        })
    except Exception as e:
        print(f'Update quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to update quiz: {str(e)}'}), 500

@admin_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@require_auth
@require_role(['admin'])
def delete_quiz(quiz_id):
    """Delete a quiz - Using stored procedure (deletes Quiz_Questions and cascades to Quiz_Answer)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('EXEC DeleteQuiz %s', (quiz_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Quiz deleted successfully'})
    except Exception as e:
        print(f'Delete quiz error: {e}')
        return jsonify({'success': False, 'error': f'Failed to delete quiz: {str(e)}'}), 500

@admin_bp.route('/quizzes/<int:quiz_id>/answers', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_quiz_answers(quiz_id):
    """Get all student answers for a quiz - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f'[Backend] get_quiz_answers called with quiz_id={quiz_id}')
        cursor.execute('EXEC GetQuizAnswersByQuizID %s', (quiz_id,))
        answers = cursor.fetchall()
        conn.close()
        
        result = []
        for answer in answers:
            # Tuple access: University_ID, First_Name, Last_Name, QuizID, Assessment_ID, Responses, completion_status, score, Quiz_Content, pass_score, Start_Date, End_Date
            result.append({
                'University_ID': int(answer[0]),
                'First_Name': answer[1],
                'Last_Name': answer[2],
                'QuizID': answer[3],
                'Assessment_ID': answer[4],
                'Responses': answer[5],
                'completion_status': answer[6],
                'score': float(answer[7]) if answer[7] else None,
                'Quiz_Content': answer[8],
                'pass_score': float(answer[9]) if answer[9] else None,
                'Start_Date': str(answer[10]) if answer[10] else None,
                'End_Date': str(answer[11]) if answer[11] else None,
            })
        
        print(f'[Backend] Returning {len(result)} quiz answers')
        return jsonify(result)
    except Exception as e:
        print(f'Get quiz answers error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch quiz answers: {str(e)}'}), 500

# ==================== STUDENTS MANAGEMENT ====================

@admin_bp.route('/students', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
def get_all_submissions():
    """Get all submissions - Updated to use Assignment_Submission"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                asub.University_ID,
                asub.AssignmentID,
                asub.Assessment_ID,
                asub.score,
                asub.accepted_specification,
                asub.late_flag_indicator,
                asub.SubmitDate,
                asub.attached_files,
                asub.status,
                asub.Comments,
                u.First_Name,
                u.Last_Name,
                ad.Course_ID,
                ad.Semester,
                c.Name as Course_Name
            FROM [Assignment_Submission] asub
            INNER JOIN [Users] u ON asub.University_ID = u.University_ID
            INNER JOIN [Assignment_Definition] ad ON asub.AssignmentID = ad.AssignmentID
            INNER JOIN [Course] c ON ad.Course_ID = c.Course_ID
            ORDER BY asub.SubmitDate DESC
        """)
        submissions = cursor.fetchall()
        conn.close()

        result = []
        for submission in submissions:
            # Tuple access: University_ID, AssignmentID, Assessment_ID, score, accepted_specification, late_flag_indicator, SubmitDate, attached_files, status, Comments, First_Name, Last_Name, Course_ID, Semester, Course_Name
            result.append({
                'University_ID': submission[0],
                'AssignmentID': submission[1],
                'Assessment_ID': submission[2],
                'score': float(submission[3]) if submission[3] is not None else None,
                'accepted_specification': submission[4],
                'late_flag_indicator': bool(submission[5]) if submission[5] is not None else None,
                'SubmitDate': str(submission[6]) if submission[6] else None,
                'attached_files': submission[7],
                'status': submission[8],
                'Comments': submission[9],
                'First_Name': submission[10],
                'Last_Name': submission[11],
                'Student_Name': f"{submission[11]} {submission[10]}",
                'Course_ID': submission[12],
                'Semester': submission[13],
                'Course_Name': submission[14],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all submissions error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Failed to fetch submissions'}), 500

# ==================== STATISTICS/DASHBOARD ====================

@admin_bp.route('/statistics', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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

@admin_bp.route('/equipment-types', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_equipment_types():
    """Get all equipment types - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllEquipmentTypes')
        equipment_types = cursor.fetchall()
        conn.close()

        result = []
        for eq in equipment_types:
            result.append(eq[0])  # Equipment_Name

        return jsonify(result)
    except Exception as e:
        print(f'Get equipment types error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch equipment types: {str(e)}'}), 500

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>/equipment', methods=['GET'])
@require_auth
@require_role(['admin'])
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

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>/equipment', methods=['PUT'])
@require_auth
@require_role(['admin'])
def update_room_equipment(building_name, room_name):
    """Update equipment for a specific room - Using stored procedure"""
    try:
        data = request.get_json()
        equipment_list = data.get('equipment', [])
        
        # Convert list to JSON string
        import json
        equipment_json = json.dumps(equipment_list)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC UpdateRoomEquipment %s, %s, %s', (building_name, room_name, equipment_json))
        result = cursor.fetchone()
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': result[0] if result else 'Room equipment updated successfully'
        })
    except Exception as e:
        print(f'Update room equipment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update room equipment: {str(e)}'}), 500

@admin_bp.route('/rooms/<string:building_name>/<string:room_name>/sections', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_room_sections(building_name, room_name):
    """Get sections that use a specific room - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetRoomSections %s, %s', (building_name, room_name))
        sections = cursor.fetchall()
        conn.close()

        result = []
        for section in sections:
            result.append({
                'Section_ID': section[0],
                'Course_ID': section[1],
                'Course_Name': section[2],
                'Semester': section[3],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get room sections error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch room sections: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/rooms', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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

# ==================== SCHEDULE MANAGEMENT ====================

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/schedule', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_section_schedule(section_id, course_id, semester):
    """Get schedule for a section - Using stored procedure"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetSectionSchedule %s, %s, %s', (section_id, course_id, semester))
        schedule = cursor.fetchall()
        conn.close()

        result = []
        for entry in schedule:
            result.append({
                'Section_ID': entry[0],
                'Course_ID': entry[1],
                'Semester': entry[2],
                'Day_of_Week': entry[3],
                'Start_Period': entry[4],
                'End_Period': entry[5],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get section schedule error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch section schedule: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/schedule', methods=['POST'])
@require_auth
@require_role(['admin'])
def create_schedule_entry(section_id, course_id, semester):
    """Create a schedule entry for a section - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC CreateScheduleEntry %s, %s, %s, %s, %s, %s',
                      (section_id, course_id, semester,
                       data['Day_of_Week'], data['Start_Period'], data['End_Period']))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Schedule entry created successfully'
        })
    except Exception as e:
        print(f'Create schedule entry error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to create schedule entry: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/schedule', methods=['PUT'])
@require_auth
@require_role(['admin'])
def update_schedule_entry(section_id, course_id, semester):
    """Update a schedule entry for a section - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC UpdateScheduleEntry %s, %s, %s, %s, %s, %s, %s, %s, %s',
                      (section_id, course_id, semester,
                       data['Old_Day_of_Week'], data['Old_Start_Period'], data['Old_End_Period'],
                       data.get('New_Day_of_Week'), data.get('New_Start_Period'), data.get('New_End_Period')))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Schedule entry updated successfully'
        })
    except Exception as e:
        print(f'Update schedule entry error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update schedule entry: {str(e)}'}), 500

@admin_bp.route('/sections/<string:section_id>/<string:course_id>/<string:semester>/schedule', methods=['DELETE'])
@require_auth
@require_role(['admin'])
def delete_schedule_entry(section_id, course_id, semester):
    """Delete a schedule entry for a section - Using stored procedure"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('EXEC DeleteScheduleEntry %s, %s, %s, %s, %s, %s',
                      (section_id, course_id, semester,
                       data['Day_of_Week'], data['Start_Period'], data['End_Period']))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Schedule entry deleted successfully'
        })
    except Exception as e:
        print(f'Delete schedule entry error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to delete schedule entry: {str(e)}'}), 500

@admin_bp.route('/schedules', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_all_schedules():
    """Get all schedules with optional filters - Using stored procedure"""
    try:
        course_id = request.args.get('course_id', type=str)
        semester = request.args.get('semester', type=str)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetAllSchedules %s, %s', (course_id, semester))
        schedules = cursor.fetchall()
        conn.close()

        result = []
        for schedule in schedules:
            result.append({
                'Section_ID': schedule[0],
                'Course_ID': schedule[1],
                'Semester': schedule[2],
                'Day_of_Week': schedule[3],
                'Day_Name': schedule[4],
                'Start_Period': schedule[5],
                'End_Period': schedule[6],
                'Course_Name': schedule[7],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get all schedules error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch schedules: {str(e)}'}), 500

@admin_bp.route('/schedules/by-room', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_schedules_by_room():
    """Get schedules grouped by room - Using stored procedure"""
    try:
        building_name = request.args.get('building_name', type=str)
        room_name = request.args.get('room_name', type=str)
        semester = request.args.get('semester', type=str)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetSchedulesByRoom %s, %s, %s', (building_name, room_name, semester))
        schedules = cursor.fetchall()
        conn.close()

        result = []
        for schedule in schedules:
            result.append({
                'Building_Name': schedule[0],
                'Room_Name': schedule[1],
                'Section_ID': schedule[2],
                'Course_ID': schedule[3],
                'Semester': schedule[4],
                'Day_of_Week': schedule[5],
                'Day_Name': schedule[6],
                'Start_Period': schedule[7],
                'End_Period': schedule[8],
                'Course_Name': schedule[9],
            })

        return jsonify(result)
    except Exception as e:
        print(f'Get schedules by room error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch schedules by room: {str(e)}'}), 500

@admin_bp.route('/schedules/by-user', methods=['GET'])
@require_auth
@require_role(['admin'])
def get_schedules_by_user():
    """Get schedules for a specific user (student or tutor) - Using stored procedure"""
    try:
        university_id = request.args.get('university_id', type=int)
        user_type = request.args.get('user_type', type=str, default='student')  # 'student' or 'tutor'
        semester = request.args.get('semester', type=str)
        
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        if user_type not in ['student', 'tutor']:
            return jsonify({'success': False, 'error': 'user_type must be "student" or "tutor"'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetSchedulesByUser %s, %s, %s', (university_id, user_type, semester))
        schedules = cursor.fetchall()
        conn.close()

        result = []
        for schedule in schedules:
            if user_type == 'student':
                # Student schedule: Section_ID, Course_ID, Semester, Day_of_Week, Day_Name, Start_Period, End_Period, Course_Name, Enrollment_Status, Final_Grade, RoomsInfo
                schedule_dict = {
                    'Section_ID': schedule[0],
                    'Course_ID': schedule[1],
                    'Semester': schedule[2],
                    'Day_of_Week': schedule[3],
                    'Day_Name': schedule[4],
                    'Start_Period': schedule[5],
                    'End_Period': schedule[6],
                    'Course_Name': schedule[7],
                    'Enrollment_Status': schedule[8] if len(schedule) > 8 else None,
                    'Final_Grade': float(schedule[9]) if len(schedule) > 9 and schedule[9] is not None else None,
                    'RoomsInfo': schedule[10] if len(schedule) > 10 else None,
                }
            else:  # tutor
                # Tutor schedule: Section_ID, Course_ID, Semester, Day_of_Week, Day_Name, Start_Period, End_Period, Course_Name, Role_Specification, RoomsInfo
                schedule_dict = {
                    'Section_ID': schedule[0],
                    'Course_ID': schedule[1],
                    'Semester': schedule[2],
                    'Day_of_Week': schedule[3],
                    'Day_Name': schedule[4],
                    'Start_Period': schedule[5],
                    'End_Period': schedule[6],
                    'Course_Name': schedule[7],
                    'Role_Specification': schedule[8] if len(schedule) > 8 else None,
                    'RoomsInfo': schedule[9] if len(schedule) > 9 else None,
                }
            
            result.append(schedule_dict)

        return jsonify(result)
    except Exception as e:
        print(f'Get schedules by user error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch schedules by user: {str(e)}'}), 500

# ==================== ADMIN ACCOUNTS MANAGEMENT ====================

@admin_bp.route('/admins', methods=['GET'])
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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
@require_auth
@require_role(['admin'])
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

