import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import numpy as np
from multiprocessing import Pool
import pymysql
import sys

movies_df = pd.read_csv('movies_metadata.csv')
credits_df = pd.read_csv('credits.csv')

# Prepare movie descriptions
movies = []

for i, movie in movies_df.iterrows():
    try:
        credit = credits_df.iloc[i]
        
        # Construct the movie description string
        title = movie.get("title", "N/A")
        overview = movie.get("overview", "No description available")
        genres = movie.get("genres", "Unknown")
        runtime = movie.get("runtime", "Unknown")
        
        # Handle the cast and crew from the credits data
        cast = credit.get("cast", "").split(",") if "cast" in credit else []
        cast_str = ", ".join(cast) if cast else "No cast information"
        
        crew = credit.get("crew", "").split(",") if "crew" in credit else []
        director = next((person for person in crew if "Director" in person), "No director info")
        
        # Construct the final description string
        test_str = f"Title: {title} | Description: {overview} | Cast: {cast_str} | Genre: {genres} | Runtime: {runtime} minutes | Director: {director}"
        movies.append(test_str)
    
    for movie in movies:
        print(movie)
    except IndexError:
        print(f"Index error at index {i}. Mismatch between movies and credits.")
        break