"""
Script to deploy all stored procedures to the database
Run this script to execute all SQL files in the procedures folder
"""
import os
from config.database import get_db_connection

def deploy_procedures():
    """Deploy all stored procedures from the procedures folder"""
    procedures_dir = os.path.join(os.path.dirname(__file__), 'procedures')
    
    if not os.path.exists(procedures_dir):
        print(f"Error: Procedures directory not found: {procedures_dir}")
        return False
    
    # Get list of SQL files (excluding deploy_all.sql and README.md)
    sql_files = [
        'get_statistics.sql',
        'course_crud.sql',
        'course_advanced.sql',
        'section_crud.sql',
        'student_crud.sql',
        'tutor_crud.sql',
        'admin_crud.sql',
        'assignment_crud.sql',
        'quiz_crud.sql',
        'assessment_queries.sql',
        'update_user_role.sql',
        'reset_user_password.sql',
        'get_user_details.sql',
        'filter_users.sql',
        'audit_log_queries.sql',
        'advanced_statistics.sql',
        'password_reset.sql',
    ]
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Deploying stored procedures...")
        print("=" * 50)
        
        for sql_file in sql_files:
            file_path = os.path.join(procedures_dir, sql_file)
            
            if not os.path.exists(file_path):
                print(f"Warning: File not found: {sql_file}")
                continue
            
            print(f"\nDeploying: {sql_file}...")
            
            try:
                # Read SQL file
                with open(file_path, 'r', encoding='utf-8') as f:
                    sql_content = f.read()
                
                # Split by GO statements (SQL Server batch separator)
                batches = [batch.strip() for batch in sql_content.split('GO') if batch.strip()]
                
                # Execute each batch
                for batch in batches:
                    if batch:
                        cursor.execute(batch)
                
                conn.commit()
                print(f"✓ Successfully deployed: {sql_file}")
                
            except Exception as e:
                print(f"✗ Error deploying {sql_file}: {e}")
                conn.rollback()
                # Continue with next file
                continue
        
        print("\n" + "=" * 50)
        print("Deployment completed!")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()
        return False

if __name__ == '__main__':
    success = deploy_procedures()
    exit(0 if success else 1)

