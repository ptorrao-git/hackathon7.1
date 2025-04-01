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