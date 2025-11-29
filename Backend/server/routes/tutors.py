from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from utils.jwt_utils import require_auth, require_role

tutors_bp = Blueprint('tutors', __name__)

# ==================== TUTOR DASHBOARD ====================

@tutors_bp.route('/dashboard/statistics', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_dashboard_statistics():
    """Get tutor dashboard statistics"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorDashboardStatistics %s', (university_id,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({
                'total_courses': 0,
                'total_students': 0,
                'pending_assignments': 0,
                'pending_quizzes': 0,
                'completion_rate': 0,
            })
        
        return jsonify({
            'total_courses': int(result[0]) if result[0] else 0,
            'total_students': int(result[1]) if result[1] else 0,
            'pending_assignments': int(result[2]) if result[2] else 0,
            'pending_quizzes': int(result[3]) if result[3] else 0,
            'completion_rate': float(result[4]) if result[4] else 0,
        })
    except Exception as e:
        print(f'Get tutor dashboard statistics error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get statistics: {str(e)}'}), 500

@tutors_bp.route('/courses/with-sections', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_courses_with_sections():
    """Get courses with sections that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorCoursesWithSections %s', (university_id,))
        results = cursor.fetchall()
        conn.close()
        
        # Group by course
        courses_dict = {}
        for row in results:
            course_id = row[0]
            if course_id not in courses_dict:
                courses_dict[course_id] = {
                    'Course_ID': row[0],
                    'Name': row[1],
                    'Credit': int(row[2]) if row[2] else None,
                    'CCategory': row[3],
                    'Sections': []
                }
            courses_dict[course_id]['Sections'].append({
                'Section_ID': row[4],
                'Semester': row[5]
            })
        
        courses = list(courses_dict.values())
        return jsonify(courses)
    except Exception as e:
        print(f'Get tutor courses with sections error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get courses: {str(e)}'}), 500

@tutors_bp.route('/section/<string:section_id>/<string:course_id>/detail', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_section_detail(section_id, course_id):
    """Get section detail for a tutor"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorSectionDetail %s, %s, %s', (university_id, section_id, course_id))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Section not found or tutor does not teach this section'}), 404
        
        return jsonify({
            'Section_ID': result[0],
            'Course_ID': result[1],
            'Semester': result[2],
            'Course_Name': result[3],
            'Credit': int(result[4]) if result[4] else None,
            'CCategory': result[5]
        })
    except Exception as e:
        print(f'Get tutor section detail error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@tutors_bp.route('/section/<string:section_id>/<string:course_id>/<string:semester>/quizzes', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_section_quizzes(section_id, course_id, semester):
    """Get quizzes for a section that the tutor teaches"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorSectionQuizzes %s, %s, %s', (section_id, course_id, semester))
        results = cursor.fetchall()
        conn.close()
        
        # Use a set to track seen QuizIDs to prevent duplicates
        seen_quiz_ids = set()
        quizzes = []
        for row in results:
            quiz_id = row[0]
            # Skip if we've already seen this QuizID
            if quiz_id in seen_quiz_ids:
                continue
            seen_quiz_ids.add(quiz_id)
            
            # Convert Time_limits from time object to string
            time_limits_str = None
            if row[6]:
                if isinstance(row[6], str):
                    time_limits_str = row[6]
                else:
                    # Convert time object to string (HH:MM:SS format)
                    time_limits_str = str(row[6])
            
            quizzes.append({
                'QuizID': quiz_id,
                'Section_ID': row[1],
                'Course_ID': row[2],
                'Semester': row[3],
                'Grading_method': row[4],
                'pass_score': float(row[5]) if row[5] else None,
                'Time_limits': time_limits_str,
                'Start_Date': row[7].isoformat() if row[7] else None,
                'End_Date': row[8].isoformat() if row[8] else None,
                'content': row[9],
                'types': row[10],
                'Weight': float(row[11]) if row[11] else None,
                'Correct_answer': row[12],
                'Questions': row[13],
                'SubmissionCount': int(row[14]) if row[14] else 0,
                'PassedCount': int(row[15]) if row[15] else 0,
            })
        
        return jsonify(quizzes)
    except Exception as e:
        print(f'Get tutor section quizzes error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@tutors_bp.route('/section/<string:section_id>/<string:course_id>/<string:semester>/assignments', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_section_assignments(section_id, course_id, semester):
    """Get assignments for a section that the tutor teaches"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorSectionAssignments %s, %s, %s', (section_id, course_id, semester))
        results = cursor.fetchall()
        conn.close()
        
        # Use a set to track seen AssignmentIDs to prevent duplicates
        seen_assignment_ids = set()
        assignments = []
        for row in results:
            assignment_id = row[0]
            # Skip if we've already seen this AssignmentID
            if assignment_id in seen_assignment_ids:
                continue
            seen_assignment_ids.add(assignment_id)
            
            assignments.append({
                'AssignmentID': assignment_id,
                'Course_ID': row[1],
                'Semester': row[2],
                'instructions': row[3],
                'accepted_specification': row[4],
                'submission_deadline': row[5].isoformat() if row[5] else None,
                'TaskURL': row[6],
                'MaxScore': float(row[7]) if row[7] else None,
                'SubmissionCount': int(row[8]) if row[8] else 0,
                'PendingCount': int(row[9]) if row[9] else 0,
            })
        
        return jsonify(assignments)
    except Exception as e:
        print(f'Get tutor section assignments error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@tutors_bp.route('/section/<string:section_id>/<string:course_id>/<string:semester>/students', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_section_students(section_id, course_id, semester):
    """Get students in a section that the tutor teaches"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorSectionStudents %s, %s, %s', (section_id, course_id, semester))
        results = cursor.fetchall()
        conn.close()
        
        students = []
        for row in results:
            students.append({
                'University_ID': row[0],
                'First_Name': row[1],
                'Last_Name': row[2],
                'Email': row[3],
                'Major': row[4],
                'Current_degree': row[5],
            })
        
        return jsonify(students)
    except Exception as e:
        print(f'Get tutor section students error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@tutors_bp.route('/section/<string:section_id>/<string:course_id>/<string:semester>/student-grades', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_section_student_grades(section_id, course_id, semester):
    """Get student grades for all students in a section that the tutor teaches"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorSectionStudentGrades %s, %s, %s', (section_id, course_id, semester))
        results = cursor.fetchall()
        conn.close()
        
        student_grades = []
        for row in results:
            student_grades.append({
                'University_ID': row[0],
                'First_Name': row[1],
                'Last_Name': row[2],
                'Email': row[3],
                'Major': row[4],
                'Current_degree': row[5],
                'Assessment_ID': row[6],
                'Quiz_Grade': float(row[7]) if row[7] else None,
                'Assignment_Grade': float(row[8]) if row[8] else None,
                'Midterm_Grade': float(row[9]) if row[9] else None,
                'Final_Grade': float(row[10]) if row[10] else None,
                'Status': row[11],
                'GPA': float(row[12]) if row[12] else None,
            })
        
        return jsonify(student_grades)
    except Exception as e:
        print(f'Get tutor section student grades error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@tutors_bp.route('/dashboard/courses', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_courses():
    """Get courses taught by tutor"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorCourses %s', (university_id,))
        results = cursor.fetchall()
        conn.close()
        
        # Group by course
        courses_dict = {}
        for row in results:
            course_id = row[0]
            if course_id not in courses_dict:
                courses_dict[course_id] = {
                    'Course_ID': row[0],
                    'Name': row[1],  # Use Name instead of Course_Name to match Course interface
                    'Credit': int(row[2]) if row[2] else None,
                    'CCategory': row[3],
                    'SectionCount': 0,
                    'StudentCount': 0,
                    'AssignmentCount': int(row[7]) if len(row) > 7 and row[7] else 0,
                    'PendingAssignments': int(row[8]) if len(row) > 8 and row[8] else 0,
                    'Sections': []
                }
            
            # Add section
            section_id = row[4]
            semester = row[5]
            student_count = int(row[6]) if len(row) > 6 and row[6] else 0
            
            courses_dict[course_id]['Sections'].append({
                'Section_ID': section_id,
                'Semester': semester,
                'StudentCount': student_count
            })
            courses_dict[course_id]['SectionCount'] += 1
            courses_dict[course_id]['StudentCount'] += student_count
        
        courses = list(courses_dict.values())
        return jsonify(courses)
    except Exception as e:
        print(f'Get tutor courses error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get courses: {str(e)}'}), 500

@tutors_bp.route('/dashboard/grading-activity', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_grading_activity():
    """Get grading activity for tutor (for chart)"""
    try:
        university_id = request.args.get('university_id', type=int)
        months_back = request.args.get('months_back', type=int, default=5)
        
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorGradingActivity %s, %s', (university_id, months_back))
        results = cursor.fetchall()
        conn.close()
        
        activity = []
        for row in results:
            activity.append({
                'month': row[0],
                'Graded': int(row[1]) if row[1] else 0,
                'Pending': int(row[2]) if row[2] else 0,
            })
        
        return jsonify(activity)
    except Exception as e:
        print(f'Get tutor grading activity error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get grading activity: {str(e)}'}), 500

@tutors_bp.route('/dashboard/student-grade-components', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_student_grade_components():
    """Get average grade components of students in courses taught by tutor"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorStudentGradeComponents %s', (university_id,))
        results = cursor.fetchall()
        conn.close()
        
        components = []
        for row in results:
            components.append({
                'course_name': row[0],
                'Course_ID': row[1],
                'final_grade': float(row[2]) if row[2] else 0,
                'midterm_grade': float(row[3]) if row[3] else 0,
                'quiz_grade': float(row[4]) if row[4] else 0,
                'assignment_grade': float(row[5]) if row[5] else 0,
            })
        
        return jsonify(components)
    except Exception as e:
        print(f'Get tutor student grade components error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get grade components: {str(e)}'}), 500

@tutors_bp.route('/dashboard/average-student-gpa', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_average_student_gpa():
    """Get average GPA of all students in courses taught by tutor"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTutorAverageStudentGPA %s', (university_id,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({
                'average_gpa': 0,
                'total_students': 0,
                'total_courses': 0,
                'rank': 0,
            })
        
        return jsonify({
            'average_gpa': float(result[0]) if result[0] else 0,
            'total_students': int(result[1]) if result[1] else 0,
            'total_courses': int(result[2]) if result[2] else 0,
            'rank': int(result[3]) if result[3] else 0,
        })
    except Exception as e:
        print(f'Get tutor average student GPA error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get average GPA: {str(e)}'}), 500

@tutors_bp.route('/dashboard/top-tutors', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_top_tutors_by_student_gpa():
    """Get top tutors by average student GPA"""
    try:
        top_n = request.args.get('top_n', type=int, default=5)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetTopTutorsByStudentGPA %s', (top_n,))
        results = cursor.fetchall()
        conn.close()
        
        tutors = []
        for row in results:
            tutors.append({
                'rank': int(row[0]),
                'first_name': row[1],
                'last_name': row[2],
                'course': int(row[3]) if row[3] else 0,
                'hour': int(row[4]) if row[4] else 0,
                'point': float(row[5]) if row[5] else 0,
                'trend': row[6],
            })
        
        return jsonify(tutors)
    except Exception as e:
        print(f'Get top tutors by student GPA error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get top tutors: {str(e)}'}), 500

# ==================== TUTOR QUIZ CRUD ====================

@tutors_bp.route('/quizzes', methods=['POST'])
@require_auth
@require_role(['tutor'])
def create_tutor_quiz():
    """Create a new quiz for a section that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
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
                    if 'T' in start_date_str:
                        start_date_str = start_date_str.replace('T', ' ')
                    if len(start_date_str) == 16:
                        start_date_str += ':00'
                    start_date = start_date_str
            except Exception as e:
                print(f'Error parsing Start_Date: {e}')
                start_date = None
        
        if data.get('End_Date'):
            try:
                end_date_str = data.get('End_Date').strip()
                if end_date_str:
                    if 'T' in end_date_str:
                        end_date_str = end_date_str.replace('T', ' ')
                    if len(end_date_str) == 16:
                        end_date_str += ':00'
                    end_date = end_date_str
            except Exception as e:
                print(f'Error parsing End_Date: {e}')
                end_date = None
        
        # Call stored procedure - QuizID is OUTPUT parameter
        cursor.execute('EXEC CreateTutorQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
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
        print(f'Create tutor quiz error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to create quiz: {str(e)}'}), 500

@tutors_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@require_auth
@require_role(['tutor'])
def update_tutor_quiz(quiz_id):
    """Update a quiz for a section that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Convert Questions to JSON string if provided
        questions_json = None
        questions_data = data.get('Questions')
        
        if questions_data is not None:
            import json
            if isinstance(questions_data, str):
                questions_json = questions_data
            else:
                questions_json = json.dumps(questions_data, ensure_ascii=False)
        
        # Convert datetime strings to proper format
        from datetime import datetime
        start_date = None
        end_date = None
        
        if data.get('Start_Date'):
            try:
                start_date_str = data.get('Start_Date').strip()
                if start_date_str:
                    if 'T' in start_date_str:
                        start_date_str = start_date_str.replace('T', ' ')
                    if len(start_date_str) == 16:
                        start_date_str += ':00'
                    start_date = start_date_str
            except Exception as e:
                print(f'Error parsing Start_Date: {e}')
                start_date = None
        
        if data.get('End_Date'):
            try:
                end_date_str = data.get('End_Date').strip()
                if end_date_str:
                    if 'T' in end_date_str:
                        end_date_str = end_date_str.replace('T', ' ')
                    if len(end_date_str) == 16:
                        end_date_str += ':00'
                    end_date = end_date_str
            except Exception as e:
                print(f'Error parsing End_Date: {e}')
                end_date = None
        
        # First, update Questions directly if provided
        if questions_json is not None:
            cursor.execute('UPDATE [Quiz_Questions] SET Questions = %s WHERE QuizID = %s', (questions_json, quiz_id))
        
        # Then update other fields using procedure
        cursor.execute('EXEC UpdateTutorQuiz %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NULL', (
            university_id,
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

        result = cursor.fetchone()
        conn.commit()
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
        }), 200
    except Exception as e:
        print(f'Update tutor quiz error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update quiz: {str(e)}'}), 500

@tutors_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@require_auth
@require_role(['tutor'])
def delete_tutor_quiz(quiz_id):
    """Delete a quiz for a section that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC DeleteTutorQuiz %s, %s', (university_id, quiz_id))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Quiz deleted successfully'
        }), 200
    except Exception as e:
        print(f'Delete tutor quiz error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to delete quiz: {str(e)}'}), 500

# ==================== TUTOR ASSIGNMENT CRUD ====================

@tutors_bp.route('/assignments', methods=['POST'])
@require_auth
@require_role(['tutor'])
def create_tutor_assignment():
    """Create a new assignment for a course/semester that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Parse submission_deadline if provided
        submission_deadline = None
        if data.get('submission_deadline'):
            try:
                deadline_str = data.get('submission_deadline')
                if 'T' in deadline_str:
                    deadline_str = deadline_str.replace('T', ' ')
                    if len(deadline_str) == 16:
                        deadline_str += ':00'
                submission_deadline = deadline_str
            except Exception as e:
                print(f'Error parsing submission_deadline: {e}')
                submission_deadline = data.get('submission_deadline')
        
        # Call stored procedure
        cursor.execute('EXEC CreateTutorAssignment %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            data['Course_ID'],
            data['Semester'],
            data.get('MaxScore', 10),
            data.get('accepted_specification'),
            submission_deadline,
            data.get('instructions'),
            data.get('TaskURL')
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
                'TaskURL': result[7] if len(result) > 7 else None,
                'Course_Name': result[8] if len(result) > 8 else None,
                'StudentCount': result[9] if len(result) > 9 else 0,
            }
        }), 201
    except Exception as e:
        print(f'Create tutor assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to create assignment: {str(e)}'}), 500

@tutors_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
@require_auth
@require_role(['tutor'])
def update_tutor_assignment(assignment_id):
    """Update an assignment for a course/semester that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Parse submission_deadline if provided
        submission_deadline = None
        if data.get('submission_deadline'):
            try:
                deadline_str = data.get('submission_deadline')
                if 'T' in deadline_str:
                    deadline_str = deadline_str.replace('T', ' ')
                    if len(deadline_str) == 16:
                        deadline_str += ':00'
                submission_deadline = deadline_str
            except Exception as e:
                print(f'Error parsing submission_deadline: {e}')
                submission_deadline = data.get('submission_deadline')
        
        # Call stored procedure
        cursor.execute('EXEC UpdateTutorAssignment %s, %s, %s, %s, %s, %s, %s, %s, %s', (
            university_id,
            assignment_id,
            data.get('Course_ID'),
            data.get('Semester'),
            data.get('MaxScore'),
            data.get('accepted_specification'),
            submission_deadline,
            data.get('instructions'),
            data.get('TaskURL')
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
                'TaskURL': result[7] if len(result) > 7 else None,
                'Course_Name': result[8] if len(result) > 8 else None,
                'StudentCount': result[9] if len(result) > 9 else 0,
            }
        }), 200
    except Exception as e:
        print(f'Update tutor assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update assignment: {str(e)}'}), 500

@tutors_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@require_auth
@require_role(['tutor'])
def delete_tutor_assignment(assignment_id):
    """Delete an assignment for a course/semester that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC DeleteTutorAssignment %s, %s', (university_id, assignment_id))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Assignment deleted successfully'
        }), 200
    except Exception as e:
        print(f'Delete tutor assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to delete assignment: {str(e)}'}), 500

@tutors_bp.route('/quizzes/<int:quiz_id>/answers', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_quiz_answers(quiz_id):
    """Get all student answers for a quiz that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify tutor teaches the section of this quiz
        cursor.execute("""
            SELECT 1 FROM [Quiz_Questions] qq
            INNER JOIN [Teaches] t ON qq.Section_ID = t.Section_ID
                AND qq.Course_ID = t.Course_ID
                AND qq.Semester = t.Semester
            WHERE qq.QuizID = %s
              AND t.University_ID = %s
        """, (quiz_id, university_id))
        
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Tutor does not teach this section or quiz not found'}), 403
        
        cursor.execute('EXEC GetQuizAnswersByQuizID %s', (quiz_id,))
        answers = cursor.fetchall()
        conn.close()
        
        result = []
        for answer in answers:
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
        
        return jsonify(result)
    except Exception as e:
        print(f'Get tutor quiz answers error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch quiz answers: {str(e)}'}), 500

@tutors_bp.route('/assignments/<int:assignment_id>/submissions', methods=['GET'])
@require_auth
@require_role(['tutor'])
def get_tutor_assignment_submissions(assignment_id):
    """Get all assignment submissions for an assignment that the tutor teaches"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify tutor teaches the course/semester of this assignment
        cursor.execute("""
            SELECT 1 FROM [Assignment_Definition] ad
            INNER JOIN [Teaches] t ON ad.Course_ID = t.Course_ID
                AND ad.Semester = t.Semester
            WHERE ad.AssignmentID = %s
              AND t.University_ID = %s
        """, (assignment_id, university_id))
        
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Tutor does not teach this course/semester or assignment not found'}), 403
        
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
        print(f'Get tutor assignment submissions error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch assignment submissions: {str(e)}'}), 500

@tutors_bp.route('/quizzes/<int:quiz_id>/answers/<int:student_id>', methods=['PUT'])
@require_auth
@require_role(['tutor'])
def update_tutor_quiz_answer_score(quiz_id, student_id):
    """Update quiz answer score for a student"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        score = data.get('score')
        
        if score is None:
            return jsonify({'success': False, 'error': 'score is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC UpdateTutorQuizAnswerScore %s, %s, %s, %s', 
                      (university_id, quiz_id, student_id, score))
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Quiz answer not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Quiz score updated successfully',
            'quiz_answer': {
                'University_ID': result[0],
                'First_Name': result[1],
                'Last_Name': result[2],
                'QuizID': result[3],
                'Assessment_ID': result[4],
                'Responses': result[5],
                'completion_status': result[6],
                'score': float(result[7]) if result[7] else None,
                'Quiz_Content': result[8],
                'pass_score': float(result[9]) if result[9] else None,
                'Start_Date': str(result[10]) if result[10] else None,
                'End_Date': str(result[11]) if result[11] else None,
            }
        }), 200
    except Exception as e:
        print(f'Update tutor quiz answer score error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update quiz score: {str(e)}'}), 500

@tutors_bp.route('/assignments/<int:assignment_id>/submissions/<int:student_id>', methods=['PUT'])
@require_auth
@require_role(['tutor'])
def update_tutor_assignment_submission_score(assignment_id, student_id):
    """Update assignment submission score for a student"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        score = data.get('score')
        comments = data.get('comments')
        
        if score is None:
            return jsonify({'success': False, 'error': 'score is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC UpdateTutorAssignmentSubmissionScore %s, %s, %s, %s, %s', 
                      (university_id, assignment_id, student_id, score, comments))
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Assignment submission not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Assignment score updated successfully',
            'assignment_submission': {
                'University_ID': result[0],
                'First_Name': result[1],
                'Last_Name': result[2],
                'AssignmentID': result[3],
                'Assessment_ID': result[4],
                'score': float(result[5]) if result[5] else None,
                'accepted_specification': result[6],
                'late_flag_indicator': bool(result[7]) if result[7] is not None else None,
                'SubmitDate': str(result[8]) if result[8] else None,
                'attached_files': result[9],
                'status': result[10],
                'Comments': result[11],
                'Assignment_Instructions': result[12],
                'MaxScore': float(result[13]) if result[13] else None,
                'submission_deadline': str(result[14]) if result[14] else None,
            }
        }), 200
    except Exception as e:
        print(f'Update tutor assignment submission score error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update assignment score: {str(e)}'}), 500

@tutors_bp.route('/assessments/<int:assessment_id>', methods=['PUT'])
@require_auth
@require_role(['tutor'])
def update_tutor_assessment_grades(assessment_id):
    """Update assessment grades (Quiz_Grade, Assignment_Grade, Midterm_Grade, Final_Grade)"""
    try:
        university_id = request.args.get('university_id', type=int)
        if not university_id:
            return jsonify({'success': False, 'error': 'university_id is required'}), 400
        
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC UpdateTutorAssessmentGrades %s, %s, %s, %s, %s, %s', 
                      (university_id, assessment_id,
                       data.get('Quiz_Grade'),
                       data.get('Assignment_Grade'),
                       data.get('Midterm_Grade'),
                       data.get('Final_Grade')))
        result = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if not result:
            return jsonify({'success': False, 'error': 'Assessment not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Assessment grades updated successfully',
            'assessment': {
                'Assessment_ID': result[0],
                'University_ID': result[1],
                'Section_ID': result[2],
                'Course_ID': result[3],
                'Semester': result[4],
                'Quiz_Grade': float(result[5]) if result[5] else None,
                'Assignment_Grade': float(result[6]) if result[6] else None,
                'Midterm_Grade': float(result[7]) if result[7] else None,
                'Final_Grade': float(result[8]) if result[8] else None,
                'Status': result[9],
            }
        }), 200
    except Exception as e:
        print(f'Update tutor assessment grades error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to update assessment grades: {str(e)}'}), 500

