from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from utils.jwt_utils import require_auth

assignments_bp = Blueprint('assignments', __name__)

@assignments_bp.route('/user/<int:user_id>', methods=['GET'])
@require_auth
def get_user_assignments(user_id):
    """Get all assignments for a student from all sections"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('EXEC GetStudentAllAssignments %s', (user_id,))
        results = cursor.fetchall()
        conn.close()
        
        assignments = []
        for row in results:
            assignments.append({
                'AssignmentID': int(row[0]) if row[0] else None,
                'Course_ID': row[1],
                'Semester': row[2],
                'instructions': row[3],
                'accepted_specification': row[4],
                'submission_deadline': str(row[5]) if row[5] else None,
                'TaskURL': row[6],
                'MaxScore': float(row[7]) if row[7] else None,
                'Assessment_ID': row[8],
                'score': float(row[9]) if row[9] is not None else None,
                'status': row[10],
                'SubmitDate': str(row[11]) if row[11] else None,
                'late_flag_indicator': bool(row[12]) if row[12] is not None else None,
                'attached_files': row[13],
                'Comments': row[14],
                'Section_ID': row[15],
                'Course_Name': row[16],
                'status_display': row[17]
            })
        
        return jsonify(assignments)
    except Exception as e:
        print(f'Get user assignments error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get assignments: {str(e)}'}), 500

@assignments_bp.route('/<int:id>', methods=['GET'])
@require_auth
def get_assignment(id):
    """Get assignment details by AssignmentID or Assessment_ID, including submission data if available"""
    try:
        university_id = request.args.get('university_id', type=int)
        section_id = request.args.get('section_id', type=str)
        course_id = request.args.get('course_id', type=str)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # If university_id is provided, use GetAssignmentWithSubmission to get submission data
        if university_id:
            # Try with AssignmentID first
            cursor.execute('EXEC GetAssignmentWithSubmission %s, %s, %s, %s, %s', (
                id,  # AssignmentID
                None,  # Assessment_ID
                university_id,
                section_id,
                course_id
            ))
            result = cursor.fetchone()
            
            if result:
                assignment = {
                    'AssignmentID': result[0],
                    'Course_ID': result[1],
                    'Semester': result[2],
                    'MaxScore': float(result[3]) if result[3] else None,
                    'accepted_specification': result[4],
                    'submission_deadline': str(result[5]) if result[5] else None,
                    'instructions': result[6],
                    'TaskURL': result[7] if len(result) > 7 else None,
                    'Course_Name': result[8] if len(result) > 8 else None,
                    # Submission data
                    'score': float(result[9]) if len(result) > 9 and result[9] is not None else None,
                    'SubmitDate': str(result[10]) if len(result) > 10 and result[10] else None,
                    'status': result[11] if len(result) > 11 else None,
                    'attached_files': result[12] if len(result) > 12 else None,
                    'Comments': result[13] if len(result) > 13 else None,
                    'late_flag_indicator': bool(result[14]) if len(result) > 14 and result[14] is not None else None,
                    'submission_status_display': result[15] if len(result) > 15 else None,
                }
                conn.close()
                return jsonify(assignment)
            
            # If not found by AssignmentID, try with Assessment_ID
            cursor.execute('EXEC GetAssignmentWithSubmission %s, %s, %s, %s, %s', (
                None,  # AssignmentID
                id,  # Assessment_ID
                university_id,
                section_id,
                course_id
            ))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                assignment = {
                    'AssignmentID': result[0],
                    'Course_ID': result[1],
                    'Semester': result[2],
                    'MaxScore': float(result[3]) if result[3] else None,
                    'accepted_specification': result[4],
                    'submission_deadline': str(result[5]) if result[5] else None,
                    'instructions': result[6],
                    'TaskURL': result[7] if len(result) > 7 else None,
                    'Course_Name': result[8] if len(result) > 8 else None,
                    # Submission data
                    'score': float(result[9]) if len(result) > 9 and result[9] is not None else None,
                    'SubmitDate': str(result[10]) if len(result) > 10 and result[10] else None,
                    'status': result[11] if len(result) > 11 else None,
                    'attached_files': result[12] if len(result) > 12 else None,
                    'Comments': result[13] if len(result) > 13 else None,
                    'late_flag_indicator': bool(result[14]) if len(result) > 14 and result[14] is not None else None,
                    'submission_status_display': result[15] if len(result) > 15 else None,
                }
                return jsonify(assignment)
        
        # Fallback to original methods if no university_id or not found
        # First try to get by AssignmentID
        cursor.execute('EXEC GetAssignmentById %s', (id,))
        result = cursor.fetchone()
        
        if result:
            # Found by AssignmentID
            assignment = {
                'AssignmentID': result[0],
                'Course_ID': result[1],
                'Semester': result[2],
                'MaxScore': float(result[3]) if result[3] else None,
                'accepted_specification': result[4],
                'submission_deadline': str(result[5]) if result[5] else None,
                'instructions': result[6],
                'TaskURL': result[7] if len(result) > 7 else None,
                'Course_Name': result[8] if len(result) > 8 else None,
                'StudentCount': result[9] if len(result) > 9 else 0,
            }
            conn.close()
            return jsonify(assignment)
        
        # If not found, try to get by Assessment_ID
        cursor.execute('EXEC GetAssignmentByAssessmentID %s, %s, %s, %s', (
            id,  # Assessment_ID
            university_id,
            section_id,
            course_id
        ))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            assignment = {
                'AssignmentID': result[0],
                'Course_ID': result[1],
                'Semester': result[2],
                'MaxScore': float(result[3]) if result[3] else None,
                'accepted_specification': result[4],
                'submission_deadline': str(result[5]) if result[5] else None,
                'instructions': result[6],
                'TaskURL': result[7] if len(result) > 7 else None,
                'Course_Name': result[8] if len(result) > 8 else None,
                'StudentCount': result[9] if len(result) > 9 else 0,
            }
            return jsonify(assignment)
        
        return jsonify({'success': False, 'error': 'Assignment not found'}), 404
    except Exception as e:
        print(f'Get assignment error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to get assignment: {str(e)}'}), 500

@assignments_bp.route('/<int:id>/submit', methods=['POST'])
def submit_assignment(id):
    return jsonify({'success': True, 'message': 'Assignment submitted', 'id': id})
