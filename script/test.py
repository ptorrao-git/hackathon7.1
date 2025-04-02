import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import numpy as np
from multiprocessing import Pool
import pymysql
import sys

def make_connection():
    try:
        connection = pymysql.connect(
            host='hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com',
            user='script',
            password='vCNZzmHRVLxtZErdZGtY',
            database='finalBDtests'
        )
        return connection
    except pymysql.MySQLError as err:
        print(f"Error: {err}")
        return None

def get_ml_str():
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = "SELECT ml_str FROM Movies"
    cursor.execute(query)
    results = cursor.fetchall()
    movies = [row[0] for row in results]
    cursor.close()
    connection.close()
    return movies

def get_watchHistory(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """SELECT Movies.ml_str
                FROM Movies
                INNER JOIN WatchHistory ON Movies.id = WatchHistory.movie_id
                INNER JOIN Users ON Users.user_id = WatchHistory.user_id
                WHERE Users.user_id = %s;"""
    cursor.execute(query, (user_id,))
    results = cursor.fetchall()
    watched_movies = [row[0] for row in results]
    cursor.close()
    connection.close()
    return watched_movies

def get_watchList(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """SELECT Movies.ml_str
                FROM Movies
                INNER JOIN WatchList ON Movies.id = WatchList.movie_id
                INNER JOIN Users ON Users.user_id = WatchList.user_id
                WHERE Users.user_id = %s;"""
    cursor.execute(query, (user_id,))
    results = cursor.fetchall()
    watch_history = [row[0] for row in results]
    cursor.close()
    connection.close()
    return watch_history

def get_movies_from_default(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = "SELECT movie_id FROM DefaultRecommended;"
    cursor.execute(query)
    results = cursor.fetchall()
    default_movies = [row[0] for row in results]
    for movie in default_movies:
        query = """INSERT INTO UserRecommended (user_id, movie_id, date_added)
                    VALUES (%s, %s, NOW());"""
        cursor.execute(query, (user_id, movie))
        connection.commit()
    cursor.close()
    connection.close()
    return None

def send_to_user_recommended(user_id, movie_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """INSERT INTO UserRecommended (user_id, movie_id, date_added)
                VALUES (%s, %s, NOW())
                ON DUPLICATE KEY UPDATE date_added = NOW();"""
    cursor.execute(query, (user_id, movie_id))
    connection.commit()
    cursor.close()
    connection.close()

def send_to_friend_recommended(user_id, movie_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """INSERT INTO FriendRecommended (user_id, movie_id, date_added)
                VALUES (%s, %s, NOW())
                ON DUPLICATE KEY UPDATE date_added = NOW();"""
    cursor.execute(query, (user_id, movie_id))
    connection.commit()
    cursor.close()
    connection.close()

def get_movie_id_from_ml_str(ml_str):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """SELECT id FROM Movies WHERE ml_str = %s;"""
    cursor.execute(query, (ml_str,))
    result = cursor.fetchone()
    if result:
        movie_id = result[0]
        cursor.close()
        connection.close()
        return movie_id
    else:
        return None

def get_movies_from_default_to_friend(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = "SELECT movie_id FROM DefaultRecommended;"
    cursor.execute(query)
    results = cursor.fetchall()
    default_movies = [row[0] for row in results]
    for movie in default_movies:
        query = """INSERT INTO FriendRecommended (user_id, movie_id, date_added)
                    VALUES (%s, %s, NOW());"""
        cursor.execute(query, (user_id, movie))
        connection.commit()
    cursor.close()
    connection.close()
    return None

def get_friends_recommendations(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """SELECT friend_id FROM Friends WHERE user_id = %s;"""
    cursor.execute(query, (user_id,))
    results = cursor.fetchall()
    friends = [row[0] for row in results]
    cursor.close()
    connection.close()

    for friend in friends:
        watched_movies = get_watchHistory(friend)
        watch_list = get_watchList(friend)
        if not watched_movies and not watch_list:
            get_movies_from_default_to_friend(user_id)
            return None
        else:
            user_watched = watched_movies + watch_list

        for movie in user_watched:
            if not movie or movie[0] is None:  # Skip NULL or empty movie strings
                continue
            movie_id = get_movie_id_from_ml_str(movie)
            if movie_id is None:
                continue
            send_to_friend_recommended(user_id, movie_id)

model = SentenceTransformer('sentence-transformers/paraphrase-MiniLM-L6-v2')
def encode_chunk(chunk):
    return model.encode(chunk, batch_size=64, show_progress_bar=False)

def get_recommended(uid):
    # Load the SBERT model

    # Prepare movie descriptions
    movies = get_ml_str()
    # Helper function to encode a chunk of movies

    # Split the movies into chunks for multiprocessing
    chunk_size = len(movies) // 4  # Adjust based on the number of cores available
    movie_chunks = [movies[i:i + chunk_size] for i in range(0, len(movies), chunk_size)]

    # Use multiprocessing to compute embeddings for each chunk in parallel
    with Pool(processes=4) as pool:
        movie_embeddings_chunks = pool.map(encode_chunk, movie_chunks)

    # Flatten the chunks to get the final movie embeddings
    movie_embeddings = np.vstack(movie_embeddings_chunks)

    # Example watch history (user watched these movies)
    watched_movies = get_watchHistory(uid)
    watch_list = get_watchList(uid)
    if not watched_movies and not watch_list:
        get_movies_from_default(uid)
        return None
    else:
        user_watched = watched_movies + watch_list

    user_embeddings = model.encode(user_watched, batch_size=64, show_progress_bar=True)
    user_profile = np.mean(user_embeddings, axis=0)
    knn = NearestNeighbors(n_neighbors=50, metric='cosine', n_jobs=-1)
    knn.fit(movie_embeddings)
    distances, indices = knn.kneighbors(user_profile.reshape(1, -1))
    top_recommendations = [movies[i] for i in indices[0]]

    for movie in top_recommendations:
        movie_id = get_movie_id_from_ml_str(movie)
        print(movie_id)
        send_to_user_recommended(uid, movie_id)

def main():
    if len(sys.argv) != 3:
        print("Usage: ./db_graber <action> <user_id>")
        sys.exit(1)
    action = sys.argv[1];
    uid = sys.argv[2];
    if action == "recommend":
        get_recommended(uid)
        sys.exit(0)
    if action == "friends":
        get_friends_recommendations(uid)
        sys.exit(0)

if __name__ == "__main__":
    main()