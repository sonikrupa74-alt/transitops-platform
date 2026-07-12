import pymysql
from config import *

class PyMySQLConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, dictionary=False):
        if dictionary:
            return self.conn.cursor(pymysql.cursors.DictCursor)
        return self.conn.cursor()

    def commit(self):
        return self.conn.commit()

    def rollback(self):
        return self.conn.rollback()

    def close(self):
        return self.conn.close()

def get_connection():
    # Use 127.0.0.1 on Windows to ensure quick connection resolution
    connection = pymysql.connect(
        host="127.0.0.1" if DB_HOST == "localhost" else DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    return PyMySQLConnectionWrapper(connection)