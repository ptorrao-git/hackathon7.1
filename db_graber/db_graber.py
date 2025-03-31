import pymysql
import sys

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

def get_movies_by_title_and_info():
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = "SELECT ml_str FROM dbMovies"
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results

def main():
    results = get_movies_by_title_and_info()
    if results is None:
        print("No results found.")
        sys.exit(1)
    for row in results:
        print(row[0])

if __name__ == "__main__":
    main()