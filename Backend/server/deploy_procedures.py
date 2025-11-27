"""
Script to deploy all stored procedures to the database
Run this script to execute all SQL files in the procedures folder

Usage:
    python deploy_procedures.py              # Simple output (default)
    python deploy_procedures.py --verbose     # Detailed debug output
    python deploy_procedures.py -v            # Short form for verbose
"""
import os
import argparse
from config.database import get_db_connection

def deploy_procedures(verbose=False):
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
        'course_statistics.sql',
        'section_crud.sql',
        'student_crud.sql',
        'tutor_crud.sql',
        'admin_crud.sql',
        'assignment_crud_refactored.sql',
        'quiz_crud_new.sql',
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
                # Use case-insensitive split and handle both 'GO' and 'go'
                import re
                batches = re.split(r'\bGO\b', sql_content, flags=re.IGNORECASE)
                batches = [batch.strip() for batch in batches if batch.strip()]
                
                if verbose:
                    print(f"  Found {len(batches)} batches to execute")
                
                # Execute each batch
                for i, batch in enumerate(batches, 1):
                    if batch:
                        try:
                            if verbose:
                                # Print batch info for debugging
                                batch_lines = batch.split('\n')
                                print(f"  Executing batch {i}/{len(batches)} ({len(batch_lines)} lines)")
                                
                                # Find the line that contains the procedure name or key statement
                                key_line = None
                                for line_num, line in enumerate(batch_lines[:20], 1):  # Check first 20 lines
                                    if 'CREATE PROCEDURE' in line.upper() or 'UPDATE' in line.upper():
                                        key_line = f"Line {line_num}: {line.strip()[:100]}"
                                        break
                                
                                if key_line:
                                    print(f"    {key_line}")
                            
                            # Execute the batch
                            cursor.execute(batch)
                            
                            if verbose:
                                print(f"    ✓ Batch {i} executed successfully")
                            
                        except Exception as batch_error:
                            # Always show error details, even in non-verbose mode
                            print(f"  ✗ Error in batch {i}: {batch_error}")
                            print(f"  Error type: {type(batch_error).__name__}")
                            
                            if verbose:
                                # Print the problematic batch with line numbers
                                print(f"  Batch content with line numbers:")
                                batch_lines = batch.split('\n')
                                start_line = max(0, len(batch_lines) - 20)  # Show last 20 lines or all if less
                                for line_num, line in enumerate(batch_lines[start_line:], start=start_line + 1):
                                    marker = " >>> " if line_num == 102 else "     "
                                    print(f"  {marker}{line_num:4d}: {line.rstrip()}")
                            
                            # Try to get more detailed error info
                            if hasattr(batch_error, 'args') and batch_error.args:
                                print(f"  Error args: {batch_error.args}")
                            if hasattr(batch_error, 'lineno'):
                                print(f"  Error at line: {batch_error.lineno}")
                            
                            if verbose:
                                import traceback
                                print(f"  Traceback:")
                                traceback.print_exc()
                            
                            raise batch_error
                
                conn.commit()
                print(f"✓ Successfully deployed: {sql_file}")
                
            except Exception as e:
                print(f"✗ Error deploying {sql_file}: {e}")
                print(f"  Error type: {type(e).__name__}")
                if hasattr(e, 'args') and e.args:
                    print(f"  Error args: {e.args}")
                if verbose:
                    import traceback
                    print(f"  Traceback:")
                    traceback.print_exc()
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
    parser = argparse.ArgumentParser(
        description='Deploy all stored procedures to the database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy_procedures.py              # Simple output (default)
  python deploy_procedures.py --verbose     # Detailed debug output
  python deploy_procedures.py -v            # Short form for verbose
        """
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose/debug output showing batch execution details'
    )
    
    args = parser.parse_args()
    success = deploy_procedures(verbose=args.verbose)
    exit(0 if success else 1)

