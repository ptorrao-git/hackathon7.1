const API_URL = 'http://localhost:3001'; // Your backend server URL

export const getMovies = async () => {
  try {
    const response = await fetch(`${API_URL}/api/movies`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

// Get recommendations for a specific user
export const getUserRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/${userId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

// Trigger recommendation update for a user
export const updateUserRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/update-recommendations/${userId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating recommendations:', error);
    throw error;
  }
};

// Watchlist operations
export const addToWatchlist = async (userId, movieId, movieTitle) => {
  try {
    const response = await fetch(`${API_URL}/api/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        movieId,
        movieTitle
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add movie to watchlist: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding movie to watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_URL}/api/watchlist`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, movieId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove from watchlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};

export const isInWatchlist = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_URL}/api/watchlist/check?userId=${userId}&movieId=${movieId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check watchlist');
    }
    
    const data = await response.json();
    return data.inWatchlist;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

export const getUserWatchlist = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/watchlist/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch watchlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

// Watch history operations
export const addToWatchHistory = async (userId, movieId) => {
  try {
    const response = await fetch(`${API_URL}/api/watch-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, movieId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add to watch history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding to watch history:', error);
    throw error;
  }
};

export const getUserWatchHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/watch-history/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch watch history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching watch history:', error);
    throw error;
  }
};

// Add a movie to the user's not recommended list
export const addToNotRecommended = async (userId, movieId, movieTitle) => {
  try {
    const response = await fetch(`${API_URL}/api/not-recommended`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        movieId,
        movieTitle
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark as not recommended: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking as not recommended:', error);
    throw error;
  }
};

// Get user's not recommended list
export const getUserNotRecommendedList = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/not-recommended/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch not recommended list');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching not recommended list:', error);
    throw error;
  }
};

// Friend operations
export const searchUsersByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/user/search?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error('Failed to search users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const addFriend = async (userId, friendId) => {
  try {
    const response = await fetch(`${API_URL}/api/friends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, friendId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add friend');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding friend:', error);
    throw error;
  }
};

export const getFriends = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/friends/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get friends');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Friend recommendations
export const getFriendRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/friends/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch friend recommendations');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    throw error;
  }
};

// Get direct user recommendations for the discover screen
export const getDiscoverUserRecommendations = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/user-direct/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch direct user recommendations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching direct user recommendations:', error);
    throw error;
  }
}; 