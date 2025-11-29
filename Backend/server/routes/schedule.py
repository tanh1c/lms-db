from flask import Blueprint, jsonify
from config.database import get_db_connection
from utils.jwt_utils import require_auth

schedule_bp = Blueprint('schedule', __name__)

# Day of week mapping: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
DAY_NAMES = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
}

# Period to time mapping
# period 1: 6 AM, period 2: 7 AM, ..., period 7: 12 PM, period 8: 13 PM (1 PM), ..., period 13: 18 PM (6 PM)
def period_to_time(period):
    """Convert period number to time string (24-hour format)"""
    if period <= 6:
        # 6 AM to 11 AM (period 1-6 -> 06:00 to 11:00)
        hour = 5 + period
        return f"{hour:02d}:00"
    elif period == 7:
        # 12 PM (noon)
        return "12:00"
    else:
        # 1 PM to 6 PM (period 8-13 -> 13:00 to 18:00 in 24h format)
        hour = period + 5  # period 8 -> 13, period 9 -> 14, etc.
        return f"{hour:02d}:00"

@schedule_bp.route('/user/<int:user_id>', methods=['GET'])
@require_auth
def get_user_schedule(user_id):
    """Get schedule for a student or tutor from all sections they are enrolled in or teach"""
    try:
        from flask import request
        # Get role from JWT token (set by require_auth decorator)
        role = getattr(request, 'current_user_role', 'student')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Use different procedure based on role
        if role == 'tutor':
            cursor.execute('EXEC GetTutorSchedule %s', (user_id,))
        else:
            cursor.execute('EXEC GetStudentSchedule %s', (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        schedule_items = []
        for row in results:
            day_of_week = int(row[4]) if row[4] else None
            start_period = int(row[5]) if row[5] else None
            end_period = int(row[6]) if row[6] else None
            
            # Convert day of week to day name
            day_name = DAY_NAMES.get(day_of_week, 'Unknown') if day_of_week else 'Unknown'
            
            # Convert periods to time string
            time_str = 'N/A'
            if start_period and end_period:
                start_time = period_to_time(start_period)
                end_time = period_to_time(end_period)
                time_str = f"{start_time} - {end_time}"
            
            schedule_items.append({
                'Section_ID': row[0],
                'Course_ID': row[1],
                'Semester': row[2],
                'Course_Name': row[3],
                'Day': day_name,
                'Time': time_str,
                'Building': row[7] if row[7] else 'N/A',
                'Room': row[8] if row[8] else 'N/A',
            })
        
        return jsonify(schedule_items)
    except Exception as e:
        print(f'Get user schedule error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Failed to fetch schedule: {str(e)}'}), 500
