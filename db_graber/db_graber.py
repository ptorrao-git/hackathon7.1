import pymysql
import sys


def validate_input(title, info):
    if not title or not info:
        print("Id and info cannot be empty.")
        return False
    return True

def make_connection():
    try:
        connection = pymysql.connect(
            host='hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com',
            user='script',
            password='vCNZzmHRVLxtZErdZGtY',
            database='hackathon'
        )
        return connection
    except pymysql.MySQLError as err:
        print(f"Error: {err}")
        return None

def get_movies_by_title_and_info(title, info):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = f"SELECT {info} FROM movies WHERE id = %s"
    cursor.execute(query, (title,))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results

def main():
    if len(sys.argv) != 3:
        print("Usage: python db_graber.py <id> <info>")
        sys.exit(1)
    title = sys.argv[1];
    info = sys.argv[2];
    allowed_info = ['title', 'description', 'rate']
    if info not in allowed_info:
        print(f"Invalid info parameter. Allowed values are: {allowed_info}")
        sys.exit(1)
    if (not validate_input(title, info)):
        sys.exit(1)
    results = get_movies_by_title_and_info(title, info)
    if results is None:
        print("No results found.")
        sys.exit(1)
    for row in results:
        print(row[0])

if __name__ == "__main__":
    main()