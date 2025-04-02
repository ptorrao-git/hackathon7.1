import pandas as pd
# from sentence_transformers import SentenceTransformer
# from sklearn.neighbors import NearestNeighbors
# import numpy as np
from multiprocessing import Pool

# Load the SBERT model
# model = SentenceTransformer('sentence-transformers/paraphrase-MiniLM-L6-v2', device='cuda')

# Read data using pandas
movies_df = pd.read_csv('movies.csv')

pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)  
pd.set_option('display.max_colwidth', None) 

print(movies_df)

# Prepare movie descriptions
movies = []

for i, movie in movies_df.iterrows():
    try:
        
        # Construct the movie description string
        title = movie.get("Movie Name", "N/A")
        overview = movie.get("overview", "No description available")
        genres = movie.get("genres", "Unknown")
        runtime = movie.get("runtime", "Unknown")
        
        # Handle the cast and crew from the credits data
        
        # Construct the final description string
        test_str = f"Title: {title} | Description: {overview} | Cast: {cast_str} | Genre: {genres} | Runtime: {runtime} minutes | Director: {director}"
        movies.append(test_str)
        
    except IndexError:
        print(f"Index error at index {i}. Mismatch between movies and credits.")
        break

# Helper function to encode a chunk of movies
def encode_chunk(chunk):
    return model.encode(chunk, batch_size=64, show_progress_bar=False)

# Split the movies into chunks for multiprocessing
chunk_size = len(movies) // 4  # Adjust based on the number of cores available
movie_chunks = [movies[i:i + chunk_size] for i in range(0, len(movies), chunk_size)]

# Use multiprocessing to compute embeddings for each chunk in parallel
with Pool(processes=4) as pool:
    movie_embeddings_chunks = pool.map(encode_chunk, movie_chunks)

# Flatten the chunks to get the final movie embeddings
movie_embeddings = np.vstack(movie_embeddings_chunks)

# Example watch history (user watched these movies)
user_watched = [
    "Title: Avatar | Description: A paraplegic marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home. | Cast: Sam Worthington, Zoe Saldana | Genre: Action, Adventure, Sci-Fi | Runtime: 162 minutes | Director: James Cameron"
]

# Generate embeddings for the user's watched movies
user_embeddings = model.encode(user_watched, batch_size=64, show_progress_bar=True)

# Create a user profile by averaging the embeddings of the movies they've watched
user_profile = np.mean(user_embeddings, axis=0)

# Use NearestNeighbors for faster similarity computation
knn = NearestNeighbors(n_neighbors=7, metric='cosine', n_jobs=-1)
knn.fit(movie_embeddings)
distances, indices = knn.kneighbors(user_profile.reshape(1, -1))

# Get the top 5 movie recommendations
top_recommendations = [movies[i] for i in indices[0]]

# Print the recommended movies
print("Recommended Movies:")
for movie in top_recommendations:
    print(movie + "\n")