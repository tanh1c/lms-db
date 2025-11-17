from config.database import get_db_connection

print('Testing SQL Server connection with Python...')
print('=' * 50)

try:
    conn = get_db_connection()
    cursor = conn.cursor()

    # Test query
    cursor.execute('SELECT @@VERSION as version')
    result = cursor.fetchone()

    print('\n✅ Connection successful!')
    print('\nSQL Server Version:')
    print(result.version)

    # Try to check database
    cursor.execute("""
        SELECT name
        FROM sys.databases
        WHERE name = 'lms_system'
    """)

    database = cursor.fetchone()

    if database:
        print('\n✅ Database "lms_system" found!')
    else:
        print('\n⚠️  Database "lms_system" not found!')

    conn.close()
    print('\n✅ Connection test completed successfully')

except Exception as e:
    print(f'\n❌ Connection failed!')
    print(f'Error details: {e}')
    print('\nPlease check:')
    print('1. SQL Server is running')
    print('2. ODBC Driver 17 for SQL Server is installed')
    print('3. The credentials in .env file are correct')
    print('4. Port 1433 is not blocked by firewall')
