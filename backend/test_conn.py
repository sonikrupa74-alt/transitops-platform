import mysql.connector
import traceback

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='transitops_db'
    )
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("Tables in DB:", tables)
    
    for (table_name,) in tables:
        print(f"\nStructure of {table_name}:")
        cursor.execute(f"DESCRIBE {table_name}")
        for col in cursor.fetchall():
            print(col)
            
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:")
    traceback.print_exc()
