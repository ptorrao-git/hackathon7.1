const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

console.log('1. Starting server setup...'); // Debug point 1

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('2. Express and CORS initialized'); // Debug point 2

// Debug: Print when server starts
console.log('Starting server initialization...');

// Replace these values with your actual AWS RDS credentials
const dbConfig = {
  host: 'hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com', // ⬅️ CHANGE THIS
  user: 'filferna',                              // ⬅️ CHANGE THIS
  password: 'thg8f3fx1',                          // ⬅️ CHANGE THIS
  database: 'finalBDtests',                     // ⬅️ CHANGE THIS
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
      title,
      overview,
      poster_path,
      release_date    
    FROM Movies
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
          imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`;
        }

        return {
          id: movie.id || Math.random().toString(36).substr(2, 9),
          title: movie.title,
          description: movie.overview,
          image: imageUrl,
          fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`,
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

// Update the search endpoint to use 'title' instead of 'name'
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.term;
  
  if (!searchTerm || searchTerm.trim() === '') {
    return res.json({ results: [] });
  }
  
  console.log('Searching for:', searchTerm);
  
  // Use wildcard search for title or overview
  const safeSearchTerm = `%${searchTerm}%`;
  
  // Updated query using correct column names
  const query = `
    SELECT 
      id,
      title,
      overview AS description, 
      poster_path AS image,
      release_date,
      vote_average
    FROM 
      Movies 
    WHERE 
      title LIKE ? OR overview LIKE ?
    LIMIT 20
  `;
  
  pool.query(query, [safeSearchTerm, safeSearchTerm], (error, results) => {
    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Database search failed' });
    }
    
    console.log(`Found ${results.length} results for "${searchTerm}"`);
    
    try {
      // Process the results to match your frontend expectations
      const processedResults = results.map(movie => {
        // Safely format the rating
        let formattedRating = 'N/A';
        if (movie.vote_average !== null && movie.vote_average !== undefined) {
          const ratingNum = parseFloat(movie.vote_average);
          if (!isNaN(ratingNum)) {
            formattedRating = ratingNum.toFixed(1);
          }
        }
        
        // Safely format the release date
        let year = 'Unknown';
        if (movie.release_date && typeof movie.release_date === 'string' && movie.release_date.length >= 4) {
          year = movie.release_date.substring(0, 4);
        }
        
        return {
          id: movie.id,
          title: movie.title,
          description: movie.description || 'No description available',
          image: movie.image && movie.image.startsWith('/') 
            ? `https://image.tmdb.org/t/p/w500${movie.image}` 
            : movie.image,
          year: year,
          rating: formattedRating
        };
      });
      
      res.json({ results: processedResults });
    } catch (err) {
      console.error('Error processing search results:', err);
      res.status(500).json({ error: 'Error processing search results' });
    }
  });
});

// Secret key for JWT (in production, use environment variables)
const JWT_SECRET = 'your_jwt_secret_key';

// User Registration Endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, gender, birthday } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM Users WHERE email = ?';
    pool.query(checkUserQuery, [email], async (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error occurred' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      const insertUserQuery = `
        INSERT INTO Users (email, password, gender, birthday) 
        VALUES (?, ?, ?, ?)
      `;
      
      pool.query(
        insertUserQuery, 
        [email, hashedPassword, gender || null, birthday || null], 
        (error, results) => {
          if (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Failed to create user: ' + error.message });
          }
          
          // Generate JWT token
          const token = jwt.sign(
            { userId: results.insertId, email },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          res.status(201).json({
            message: 'User created successfully',
            token,
            userId: results.insertId
          });
        }
      );
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'An unexpected error occurred: ' + err.message });
  }
});

// User Login Endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const query = 'SELECT * FROM Users WHERE email = ?';
    pool.query(query, [email], async (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error occurred' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const user = results[0];
      
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        userId: user.user_id
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred: ' + err.message });
  }
});

// Middleware to verify JWT token for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route to get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const query = 'SELECT user_id, email, gender, birthday FROM Users WHERE user_id = ?';
  pool.query(query, [req.user.userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error occurred' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Format the birthday if it exists
    const user = results[0];
    if (user.birthday) {
      user.birthday = new Date(user.birthday).toISOString().split('T')[0];
    }
    
    res.json({ user });
  });
});

// Update diagnostic endpoint with correct case
app.get('/api/db-info', (req, res) => {
  // Get table structure for Movies
  const moviesQuery = "DESCRIBE Movies";
  
  pool.query(moviesQuery, (error, moviesResults) => {
    if (error) {
      console.error('Error getting Movies structure:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get table structure for Users (not users)
    const usersQuery = "DESCRIBE Users";
    
    pool.query(usersQuery, (error, usersResults) => {
      if (error) {
        console.error('Error getting Users structure:', error);
        return res.status(500).json({ 
          movies: moviesResults,
          usersError: error.message
        });
      }
      
      // Return both table structures
      res.json({
        movies: moviesResults,
        users: usersResults
      });
    });
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