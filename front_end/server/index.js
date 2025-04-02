const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const path = require('path');

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

// New endpoint to trigger recommendations update for a user
app.get('/api/update-recommendations/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Updating recommendations for user ${userId}`);
  
  // Use child_process to run the Python script
  const scriptPath = path.resolve(__dirname, '../../script/test.py');
  
  // Log the path we're trying to use
  console.log(`Attempting to run script at: ${scriptPath}`);
  
  exec(`python3 ${scriptPath} recommend ${userId}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running script: ${error}`);
      
      // Fallback to using the path directly in case the script is in a different location
      console.log('Trying fallback script location...');
      const fallbackPath = '/home/profeta/Documents/hackathon7.1/script/test.py';
      
      exec(`python3 ${fallbackPath} recommend ${userId}`, (fallbackError, fallbackStdout, fallbackStderr) => {
        if (fallbackError) {
          console.error(`Fallback also failed: ${fallbackError}`);
          return res.status(500).json({ 
            error: 'Failed to update recommendations', 
            details: `Tried paths: ${scriptPath} and ${fallbackPath}`
          });
        }
        
        console.log(`Fallback script output: ${fallbackStdout}`);
        if (fallbackStderr) console.error(`Fallback script errors: ${fallbackStderr}`);
        
        res.json({ success: true, message: 'Recommendations updated successfully via fallback' });
      });
      return;
    }
    
    console.log(`Script output: ${stdout}`);
    if (stderr) console.error(`Script errors: ${stderr}`);
    
    res.json({ success: true, message: 'Recommendations updated successfully' });
  });
});

// Add to watchlist API endpoint
app.post('/api/watchlist', async (req, res) => {
  const { userId, movieId, movieTitle } = req.body;
  console.log(`Attempt to add movie ${movieId} to watchlist for user ${userId}`);
  
  if (!userId || (!movieId && !movieTitle)) {
    return res.status(400).json({ error: 'userId and either movieId or movieTitle are required' });
  }

  try {
    // Check if movie exists in Movies table
    let checkMovieQuery = 'SELECT id FROM Movies WHERE id = ?';
    const [movieExists] = await pool.promise().query(checkMovieQuery, [movieId]);
    
    let finalMovieId = movieId;
    
    // If movie doesn't exist by ID but we have a title, try to find it by title
    if (movieExists.length === 0 && movieTitle) {
      const [movieByTitle] = await pool.promise().query('SELECT id FROM Movies WHERE title = ?', [movieTitle]);
      if (movieByTitle.length > 0) {
        finalMovieId = movieByTitle[0].id;
        console.log(`Found movie by title: ${movieTitle}, ID: ${finalMovieId}`);
      } else {
        return res.status(404).json({ error: 'Movie not found in database' });
      }
    } else if (movieExists.length === 0) {
      return res.status(404).json({ error: 'Movie not found in database' });
    }
    
    // Insert into WatchList table
    await insertIntoWatchlist(userId, finalMovieId);
    
    // Update FriendRecommended table for the user's friends
    await updateFriendRecommendations(userId, finalMovieId);
    
    res.status(201).json({ message: 'Movie added to watchlist and friend recommendations updated' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add movie to watchlist' });
  }
});

// Helper function to insert into watchlist
async function insertIntoWatchlist(userId, movieId) {
  const insertQuery = 'INSERT INTO WatchList (user_id, movie_id) VALUES (?, ?)';
  try {
    await pool.promise().query(insertQuery, [userId, movieId]);
    console.log(`Added movie ${movieId} to watchlist for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error inserting into watchlist: ${error.message}`);
    // Re-throw the error to be caught by the caller
    throw error;
  }
}

// Function to update FriendRecommended table
async function updateFriendRecommendations(userId, movieId) {
  try {
    // First, get all friends of the user
    const [friends] = await pool.promise().query(
      'SELECT friend_id FROM Friends WHERE user_id = ? AND status = "accepted"',
      [userId]
    );
    
    if (friends.length === 0) {
      console.log(`User ${userId} has no friends to recommend movie ${movieId} to`);
      return;
    }
    
    console.log(`Found ${friends.length} friends for user ${userId}`);
    
    // For each friend, add this movie to their FriendRecommended table
    for (const friend of friends) {
      const friendId = friend.friend_id;
      
      // Check if this movie is already in the friend's FriendRecommended table
      const [existingRec] = await pool.promise().query(
        'SELECT id FROM FriendRecommended WHERE user_id = ? AND movie_id = ?',
        [friendId, movieId]
      );
      
      if (existingRec.length === 0) {
        // Insert into FriendRecommended table
        await pool.promise().query(
          'INSERT INTO FriendRecommended (user_id, movie_id, date_added) VALUES (?, ?, NOW())',
          [friendId, movieId]
        );
        console.log(`Added movie ${movieId} to FriendRecommended for user ${friendId}`);
      } else {
        console.log(`Movie ${movieId} already in FriendRecommended for user ${friendId}`);
      }
    }
  } catch (error) {
    console.error(`Error updating friend recommendations: ${error.message}`);
    // Log the error but don't fail the watchlist addition
  }
}

// Remove movie from watchlist
app.delete('/api/watchlist', (req, res) => {
  const { userId, movieId } = req.body;
  
  if (!userId || !movieId) {
    return res.status(400).json({ error: 'User ID and Movie ID are required' });
  }
  
  const query = `
    DELETE FROM WatchList 
    WHERE user_id = ? AND movie_id = ?
  `;
  
  pool.query(query, [userId, movieId], (err, result) => {
    if (err) {
      console.error('Error removing from watchlist:', err);
      return res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
    
    res.json({ success: true, message: 'Removed from watchlist' });
  });
});

// Check if movie is in watchlist
app.get('/api/watchlist/check', (req, res) => {
  const { userId, movieId } = req.query;
  
  if (!userId || !movieId) {
    return res.status(400).json({ error: 'User ID and Movie ID are required' });
  }
  
  const query = `
    SELECT * FROM WatchList
    WHERE user_id = ? AND movie_id = ?
  `;
  
  pool.query(query, [userId, movieId], (err, results) => {
    if (err) {
      console.error('Error checking watchlist:', err);
      return res.status(500).json({ error: 'Failed to check watchlist' });
    }
    
    res.json({ inWatchlist: results.length > 0 });
  });
});

// Get user's watchlist
app.get('/api/watchlist/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT 
      m.id,
      m.title,
      m.overview,
      m.poster_path,
      m.release_date,
      m.vote_average
    FROM 
      Movies m
    JOIN 
      WatchList w ON m.id = w.movie_id
    WHERE 
      w.user_id = ?
  `;
  
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching watchlist:', err);
      return res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
    
    const transformedResults = results.map(movie => {
      let imageUrl;
      
      if (movie.poster_path && movie.poster_path !== '') {
        imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      } else {
        imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`;
      }
      
      // Fix for vote_average processing
      let rating = 'N/A';
      if (movie.vote_average !== null && movie.vote_average !== undefined) {
        const ratingNum = parseFloat(movie.vote_average);
        if (!isNaN(ratingNum)) {
          rating = ratingNum.toFixed(1);
        }
      }
      
      return {
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        image: imageUrl,
        fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`,
        releaseDate: movie.release_date,
        rating: rating
      };
    });
    
    res.json({ watchlist: transformedResults });
  });
});

// Add to watch history
app.post('/api/watch-history', async (req, res) => {
  const { userId, movieId } = req.body;
  
  if (!userId || !movieId) {
    return res.status(400).json({ error: 'User ID and Movie ID are required' });
  }
  
  const query = `
    INSERT INTO WatchHistory (user_id, movie_id, watched_at)
    VALUES (?, ?, NOW())
  `;
  
  try {
    await pool.promise().query(query, [userId, movieId]);
    console.log(`Added movie ${movieId} to watch history for user ${userId}`);
    res.json({ success: true, message: 'Added to watch history' });
  } catch (err) {
    console.error('Error adding to watch history:', err);
    res.status(500).json({ error: 'Failed to add to watch history' });
  }
});

// Get user's watch history
app.get('/api/watch-history/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT 
      m.id,
      m.title,
      m.overview,
      m.poster_path,
      m.release_date,
      m.vote_average,
      wh.watched_at
    FROM 
      Movies m
    JOIN 
      WatchHistory wh ON m.id = wh.movie_id
    WHERE 
      wh.user_id = ?
    ORDER BY 
      wh.watched_at DESC
  `;
  
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching watch history:', err);
      return res.status(500).json({ error: 'Failed to fetch watch history' });
    }
    
    const transformedResults = results.map(movie => {
      let imageUrl;
      
      if (movie.poster_path && movie.poster_path !== '') {
        imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      } else {
        imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`;
      }
      
      // Fix for vote_average processing
      let rating = 'N/A';
      if (movie.vote_average !== null && movie.vote_average !== undefined) {
        const ratingNum = parseFloat(movie.vote_average);
        if (!isNaN(ratingNum)) {
          rating = ratingNum.toFixed(1);
        }
      }
      
      return {
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        image: imageUrl,
        fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`,
        releaseDate: movie.release_date,
        rating: rating,
        watchedAt: movie.watched_at
      };
    });
    
    res.json({ history: transformedResults });
  });
});

// Add to UserNotRecommended table
app.post('/api/not-recommended', (req, res) => {
  const { userId, movieId } = req.body;
  
  if (!userId || !movieId) {
    return res.status(400).json({ error: 'User ID and Movie ID are required' });
  }
  
  console.log(`Attempting to add movie ${movieId} to not recommended for user ${userId}`);
  
  // First check if the movie exists
  const checkMovieQuery = `SELECT id FROM Movies WHERE id = ?`;
  
  pool.query(checkMovieQuery, [movieId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking movie existence:', checkErr);
      return res.status(500).json({ error: 'Database error when checking movie' });
    }
    
    if (checkResults.length === 0) {
      console.error(`Movie ID ${movieId} not found in database`);
      
      // For client-side generated IDs, try to find by title if the ID isn't found
      // This is a workaround for the mismatch between client and server IDs
      if (req.body.movieTitle) {
        const findByTitleQuery = `SELECT id FROM Movies WHERE title = ?`;
        pool.query(findByTitleQuery, [req.body.movieTitle], (titleErr, titleResults) => {
          if (titleErr || titleResults.length === 0) {
            return res.status(404).json({ error: 'Movie not found in database' });
          }
          
          const dbMovieId = titleResults[0].id;
          console.log(`Found movie by title. Using database ID: ${dbMovieId}`);
          
          // Now use the correct database ID for insertion
          insertIntoNotRecommended(userId, dbMovieId, res);
        });
        return;
      }
      
      return res.status(404).json({ error: 'Movie not found in database' });
    }
    
    // If movie exists, proceed with insertion
    insertIntoNotRecommended(userId, movieId, res);
  });
  
  function insertIntoNotRecommended(userId, movieId, res) {
    const query = `
      INSERT INTO UserNotRecommended (user_id, movie_id, date_added)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE date_added = NOW()
    `;
    
    pool.query(query, [userId, movieId], (err, result) => {
      if (err) {
        console.error('Error adding to not recommended list:', err);
        return res.status(500).json({ error: 'Failed to add to not recommended list' });
      }
      
      console.log(`Successfully added movie ${movieId} to not recommended for user ${userId}`);
      res.json({ success: true, message: 'Added to not recommended list' });
    });
  }
});

// Get user's not recommended list
app.get('/api/not-recommended/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = `
    SELECT 
      m.id,
      m.title,
      m.overview,
      m.poster_path,
      m.release_date,
      m.vote_average
    FROM 
      Movies m
    JOIN 
      UserNotRecommended ur ON m.id = ur.movie_id
    WHERE 
      ur.user_id = ?
  `;
  
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching not recommended list:', err);
      return res.status(500).json({ error: 'Failed to fetch not recommended list' });
    }
    
    const transformedResults = results.map(movie => {
      let imageUrl;
      
      if (movie.poster_path && movie.poster_path !== '') {
        imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      } else {
        imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`;
      }
      
      // Fix for vote_average processing
      let rating = 'N/A';
      if (movie.vote_average !== null && movie.vote_average !== undefined) {
        const ratingNum = parseFloat(movie.vote_average);
        if (!isNaN(ratingNum)) {
          rating = ratingNum.toFixed(1);
        }
      }
      
      return {
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        image: imageUrl,
        fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`,
        releaseDate: movie.release_date,
        rating: rating
      };
    });
    
    res.json({ notRecommended: transformedResults });
  });
});

// Update the recommendations endpoint to exclude movies from watchlist and watch history
app.get('/api/recommendations/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching recommendations for user ${userId}`);
  
  const query = `
    SELECT 
      m.id,
      m.title,
      m.overview,
      m.poster_path,
      m.release_date,
      m.vote_average
    FROM 
      Movies m
    JOIN 
      UserRecommended ur ON m.id = ur.movie_id
    WHERE 
      ur.user_id = ?
    AND 
      m.id NOT IN (
        SELECT movie_id FROM WatchList WHERE user_id = ?
      )
    AND 
      m.id NOT IN (
        SELECT movie_id FROM WatchHistory WHERE user_id = ?
      )
    AND 
      m.id NOT IN (
        SELECT movie_id FROM UserNotRecommended WHERE user_id = ?
      )
    ORDER BY 
      ur.date_added DESC
  `;
  
  pool.query(query, [userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    try {
      const transformedResults = results.map(movie => {
        let imageUrl;
        
        if (movie.poster_path && movie.poster_path !== '') {
          imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        } else {
          imageUrl = `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`;
        }

        // Fix for vote_average processing
        let rating = 'N/A';
        if (movie.vote_average !== null && movie.vote_average !== undefined) {
          const ratingNum = parseFloat(movie.vote_average);
          if (!isNaN(ratingNum)) {
            rating = ratingNum.toFixed(1);
          }
        }
        
        return {
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          image: imageUrl,
          fallbackImage: `https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`,
          releaseDate: movie.release_date,
          rating: rating
        };
      });
      
      const response = {
        featured: transformedResults.length > 0 ? transformedResults[0] : null,
        categories: [{
          id: 'recommended',
          title: 'Recommended For You',
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

// Search for user by email
app.get('/api/user/search', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const query = `SELECT user_id, email FROM Users WHERE email LIKE ?`;
  
  pool.query(query, [`%${email}%`], (err, results) => {
    if (err) {
      console.error('Error searching for user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ users: results });
  });
});

// Add friend
app.post('/api/friends', (req, res) => {
  const { userId, friendId } = req.body;
  
  if (!userId || !friendId) {
    return res.status(400).json({ error: 'User ID and Friend ID are required' });
  }
  
  // Check if users are already friends
  const checkQuery = `SELECT * FROM Friends WHERE user_id = ? AND friend_id = ?`;
  
  pool.query(checkQuery, [userId, friendId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking friendship:', checkErr);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (checkResults.length > 0) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }
    
    // Add both friendship directions
    const addQuery1 = `INSERT INTO Friends (user_id, friend_id) VALUES (?, ?)`;
    const addQuery2 = `INSERT INTO Friends (user_id, friend_id) VALUES (?, ?)`;
    
    // First direction: user -> friend
    pool.query(addQuery1, [userId, friendId], (err1, result1) => {
      if (err1) {
        console.error('Error adding friend (direction 1):', err1);
        return res.status(500).json({ error: 'Failed to add friend' });
      }
      
      // Second direction: friend -> user
      pool.query(addQuery2, [friendId, userId], (err2, result2) => {
        if (err2) {
          console.error('Error adding friend (direction 2):', err2);
          // Delete the first insertion as this failed
          pool.query('DELETE FROM Friends WHERE user_id = ? AND friend_id = ?', [userId, friendId]);
          return res.status(500).json({ error: 'Failed to add friend' });
        }
        
        res.json({ success: true, message: 'Friend added successfully' });
      });
    });
  });
});

// Get friends
app.get('/api/friends/:userId', (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const query = `
    SELECT u.user_id, u.email
    FROM Friends f
    JOIN Users u ON f.friend_id = u.user_id
    WHERE f.user_id = ?
  `;
  
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error getting friends:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ friends: results });
  });
});

// Get friend recommendations for a user
app.get('/api/recommendations/friends/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  try {
    // Get movies from FriendRecommended table for this user
    const query = `
      SELECT m.*, fr.date_added 
      FROM Movies m
      JOIN FriendRecommended fr ON m.id = fr.movie_id
      WHERE fr.user_id = ?
      ORDER BY fr.date_added DESC
      LIMIT 20
    `;
    
    // Use the promise pool for async/await compatibility
    const [recommendations] = await pool.promise().query(query, [userId]);
    
    console.log(`Retrieved ${recommendations.length} friend recommendations for user ${userId}`);
    
    res.json({ 
      success: true, 
      recommendations 
    });
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch friend recommendations' });
  }
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