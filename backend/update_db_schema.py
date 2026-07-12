import pymysql

from config import DB_HOST, DB_USER, DB_PASSWORD

def run_migration():
    print("Connecting to MySQL...")
    host = "127.0.0.1" if DB_HOST == "localhost" else DB_HOST
    conn = pymysql.connect(
        host=host,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    
    # 1. Create database if not exists
    cursor.execute("CREATE DATABASE IF NOT EXISTS transitops_db")
    cursor.execute("USE transitops_db")
    print("Using transitops_db database.")
    
    # Helper to check if column exists
    def column_exists(table, column):
        cursor.execute(f"SHOW COLUMNS FROM `{table}` LIKE '{column}'")
        return cursor.fetchone() is not None

    # 2. Update vehicles table
    print("Checking vehicles table columns...")
    if not column_exists("vehicles", "driver_id"):
        print("Adding driver_id column to vehicles...")
        cursor.execute("ALTER TABLE vehicles ADD COLUMN driver_id INT NULL")
        
    # 3. Update drivers table
    print("Checking drivers table columns and types...")
    if not column_exists("drivers", "assigned_vehicle_id"):
        print("Adding assigned_vehicle_id column to drivers...")
        cursor.execute("ALTER TABLE drivers ADD COLUMN assigned_vehicle_id INT NULL")
        
    print("Updating drivers status enum...")
    cursor.execute("""
        ALTER TABLE drivers 
        MODIFY COLUMN status ENUM('Available', 'On Trip', 'Off Duty', 'Suspended', 'Leave', 'Assigned') 
        DEFAULT 'Available'
    """)
    
    # 4. Update trips table
    print("Checking trips table columns and types...")
    if not column_exists("trips", "revenue"):
        print("Adding revenue column to trips...")
        cursor.execute("ALTER TABLE trips ADD COLUMN revenue DECIMAL(12,2) DEFAULT 0.00")
        
    if not column_exists("trips", "final_odometer"):
        print("Adding final_odometer column to trips...")
        cursor.execute("ALTER TABLE trips ADD COLUMN final_odometer DECIMAL(12,2) NULL")
        
    if not column_exists("trips", "fuel_consumed"):
        print("Adding fuel_consumed column to trips...")
        cursor.execute("ALTER TABLE trips ADD COLUMN fuel_consumed DECIMAL(12,2) NULL")
        
    print("Updating trips status enum...")
    cursor.execute("""
        ALTER TABLE trips 
        MODIFY COLUMN trip_status ENUM('Draft', 'Scheduled', 'Dispatched', 'In Progress', 'Completed', 'Cancelled') 
        DEFAULT 'Draft'
    """)
    
    # 5. Ensure fuel_logs table exists
    print("Ensuring fuel_logs table exists...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuel_logs (
            fuel_id INT AUTO_INCREMENT PRIMARY KEY,
            vehicle_id INT NOT NULL,
            liters DECIMAL(10,2) NOT NULL,
            fuel_cost DECIMAL(10,2) NOT NULL,
            fuel_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Database schema successfully migrated!")

if __name__ == "__main__":
    run_migration()
