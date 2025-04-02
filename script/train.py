import torch
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import numpy as np
from multiprocessing import Pool
import pymysql
import sys

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

def make_connection():
    try:
        connection = pymysql.connect(
            host='hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com',
            user='script',
            password='vCNZzmHRVLxtZErdZGtY',
            database='joynDBprod'
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

def get_NotRecommended(user_id):
    connection = make_connection()
    if connection is None:
        return None
    cursor = connection.cursor()
    query = """	SELECT Movies.ml_str FROM Movies
                INNER JOIN UserNotRecommended ON Movies.id = UserNotRecommended.movie_id
                INNER JOIN Users ON Users.user_id = UserNotRecommended.user_id
                WHERE Users.user_id = %s;"""
    cursor.execute(query, (user_id,))
    results = cursor.fetchall()
    watch_history = [row[0] for row in results]
    cursor.close()
    connection.close()
    return watch_history

def trained(uid):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    model.to(device)

    print("wtf1")
    watch_list = get_watchList(uid)
    watched_movies = get_watchHistory(uid)
    NotRecommended = get_NotRecommended(uid)
    train_examples = []
    print(watch_list)
    for i in watch_list:
        for x in watched_movies:
            train_examples.append(InputExample(texts=[i, x], label=0.9))
    for i in NotRecommended:
        for x in watched_movies:
            train_examples.append(InputExample(texts=[i, x], label=0.1))
    for i in NotRecommended:
        for x in watch_list:
            train_examples.append(InputExample(texts=[i, x], label=0.1))
    

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
    train_loss = losses.CosineSimilarityLoss(model)

    print("Training started...")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=1,
        warmup_steps=100
    )
    print("Training completed!")

    model_save_path = "fine_tuned_sbert"
    model.save(model_save_path)
    print(f"Model saved at: {model_save_path}")

    sentences = ["I love machine learning.", "AI and deep learning are fascinating."]
    embeddings = model.encode(sentences)

    print("\nEmbeddings:")
    print(embeddings)

def main():
    if len(sys.argv) != 2:
        print("Usage: ./db_graber <action> <user_id>")
        sys.exit(1)
    uid = sys.argv[1];
    print(uid)
    #trained(uid)
    print("wtf")
    NotRecommended = get_NotRecommended(uid)
    print(uid)

if __name__ == "__main__":
    main()