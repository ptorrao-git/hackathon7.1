const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

console.log('1. Starting server setup...'); // Debug point 1

const app = express();
app.use(cors());

console.log('2. Express and CORS initialized'); // Debug point 2

// Debug: Print when server starts
console.log('Starting server initialization...');

// Replace these values with your actual AWS RDS credentials
const dbConfig = {
  host: 'hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com', // ⬅️ CHANGE THIS
  user: 'filferna',                              // ⬅️ CHANGE THIS
  password: 'thg8f3fx1',                          // ⬅️ CHANGE THIS
  database: 'hackathon',                     // ⬅️ CHANGE THIS
  port: 3306,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  }
};

console.log('3. Database config loaded:', { // Debug point 3
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = mysql.createPool(dbConfig);

console.log('4. Pool created'); // Debug point 4

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('5A. ❌ Connection error:', err); // Debug point 5A
    return;
  }
  console.log('5B. ✅ Connection successful'); // Debug point 5B
  connection.release();
});

// For testing without database connection, use mock data
const MOCK_MOVIES = [
  {
    id: 1,
    title: 'Stranger Things',
    description: 'When a young boy vanishes, a small town uncovers a mystery.',
    image: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    category: 'Trending Now'
  },
  // ... add more mock movies if needed
];

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is working!' });
});

// Movies endpoint
app.get('/api/movies', (req, res) => {
  const query = `
    SELECT 
      name,
      overview,
      poster_path,
      release_date    
    FROM movies_db
    WHERE release_date LIKE '2012%'
  `;

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    try {
      const transformedResults = results.map(movie => {
        // Try different approaches for the image URL
        let imageUrl;

        if (movie.poster_path && movie.poster_path !== '') {
          // Try different TMDB image sizes
          const sizes = ['original', 'w500', 'w342', 'w185'];
          imageUrl = `https://image.tmdb.org/t/p/${sizes[0]}${movie.poster_path}`;
        } else {
          // If no TMDB poster, use a themed placeholder
          imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.name)}`;
        }

        return {
          id: movie.id || Math.random().toString(36).substr(2, 9),
          title: movie.name,
          description: movie.overview,
          image: imageUrl,
          fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.name)}`,
          releaseDate: movie.release_date
        };
      });

      console.log(`Processed ${transformedResults.length} movies`);
      console.log('Sample movie:', transformedResults[0]);

      const response = {
        featured: transformedResults[0],
        categories: [{
          id: 'movies2012',
          title: 'Movies from 2012',
          data: transformedResults
        }]
      };

      res.json(response);
    } catch (error) {
      console.error('Error processing results:', error);
      res.status(500).json({ error: 'Error processing results' });
    }
  });
});

// Add this search endpoint using your existing database structure
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.term;
  
  if (!searchTerm || searchTerm.trim() === '') {
    return res.json({ results: [] });
  }
  
  console.log('Searching for:', searchTerm);
  
  // Use wildcard search for name or overview
  const safeSearchTerm = `%${searchTerm}%`;
  
  // Modified query to match your actual database schema
  // Removed 'id' column and using actual table columns
  const query = `
    SELECT 
      movie_id,
      name AS title, 
      overview AS description, 
      poster_path AS image,
      release_date
    FROM 
      movies_db 
    WHERE 
      name LIKE ? OR overview LIKE ?
    LIMIT 20
  `;
  
  pool.query(query, [safeSearchTerm, safeSearchTerm], (error, results) => {
    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Database search failed' });
    }
    
    console.log(`Found ${results.length} results for "${searchTerm}"`);
    
    // Process results to match your existing format
    const processedResults = results.map(movie => ({
      id: movie.movie_id || Math.random().toString(36).substr(2, 9), // Generate an ID if missing
      title: movie.title,
      description: movie.description,
      image: movie.image && movie.image.startsWith('/') 
        ? `https://image.tmdb.org/t/p/w500${movie.image}` 
        : movie.image,
      year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'Unknown'
    }));
    
    res.json({ results: processedResults });
  });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log('11. 🚀 Server running on http://localhost:' + PORT); // Debug point 11
  console.log('Waiting for requests...\n');
});

// Add error handlers
server.on('error', (err) => {
  console.error('12A. ❌ Server error:', err); // Debug point 12A
});

process.on('uncaughtException', (err) => {
  console.error('12B. ❌ Uncaught exception:', err); // Debug point 12B
});

process.on('unhandledRejection', (err) => {
  console.error('12C. ❌ Unhandled rejection:', err); // Debug point 12C
}); 