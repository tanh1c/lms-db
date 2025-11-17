from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import routes
from routes_py.auth import auth_bp
from routes_py.users import users_bp
from routes_py.courses import courses_bp
from routes_py.assignments import assignments_bp
from routes_py.students import students_bp
from routes_py.quizzes import quizzes_bp
from routes_py.grades import grades_bp
from routes_py.schedule import schedule_bp

# Import database config
from config_py.database import get_db_connection

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 3001))

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'LMS API Server is running'})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(courses_bp, url_prefix='/api/courses')
app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
app.register_blueprint(students_bp, url_prefix='/api/students')
app.register_blueprint(quizzes_bp, url_prefix='/api/quizzes')
app.register_blueprint(grades_bp, url_prefix='/api/grades')
app.register_blueprint(schedule_bp, url_prefix='/api/schedule')

# Error handling
@app.errorhandler(Exception)
def handle_error(error):
    print(f'Error: {error}')
    return jsonify({
        'success': False,
        'error': str(error) or 'Internal server error'
    }), getattr(error, 'code', 500)

if __name__ == '__main__':
    try:
        # Test database connection
        conn = get_db_connection()
        print('✅ Connected to SQL Server database')
        conn.close()

        # Start server
        print(f'🚀 Server running on http://localhost:{PORT}')
        app.run(host='0.0.0.0', port=PORT, debug=True)
    except Exception as e:
        print(f'Failed to start server: {e}')
        exit(1)
