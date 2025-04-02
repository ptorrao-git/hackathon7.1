import React, { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ScrollView, Dimensions, Animated, PanResponder, Modal, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TinderCard from 'react-tinder-card';
import { 
  getMovies, 
  getUserRecommendations, 
  updateUserRecommendations,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  addToWatchHistory,
  addToNotRecommended,
  searchUsersByEmail,
  addFriend,
  getFriends,
  getFriendRecommendations
} from './src/services/movieService';
import IconFeather from 'react-native-vector-icons/Feather';

// API URL for all fetch requests
const API_URL = 'http://localhost:3001';

// First, install the database driver
// For MySQL: npm install mysql2
// For PostgreSQL: npm install pg
// For SQL Server: npm install mssql

// Example structure (we'll fill in the actual details):
const dbConfig = {
  host: 'hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com',
  port: '3306',
  database: 'finalBDtests',
  user: 'filferna',
  password: 'thg8f3fx1',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  }
};

// Also, it would be helpful to know:
// 1. Your table name
// 2. The column names for:   
//    - Movie title
//    - Description
//    - Poster/image URL

// Example query structure:
const getMoviesQuery = `
  SELECT name, overview, realease_date, poster_path
  FROM Movies
`;

// Add this sample data (you would normally fetch this from an API)
const SAMPLE_SHOWS = [
  { id: '1', title: 'Stranger Things', image: 'https://via.placeholder.com/150?text=Stranger+Things' },
  { id: '2', title: 'The Crown', image: 'https://via.placeholder.com/150?text=The+Crown' },
  { id: '3', title: 'Wednesday', image: 'https://via.placeholder.com/150?text=Wednesday' },
  { id: '4', title: 'Bridgerton', image: 'https://via.placeholder.com/150?text=Bridgerton' },
  { id: '5', title: 'Squid Game', image: 'https://via.placeholder.com/150?text=Squid+Game' },
];

// Movie data with real poster images
const FEATURED = {
  id: 'featured',
  title: 'Stranger Things',
  image: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
  description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.'
};

const CATEGORIES = [
  {
    id: 'trending',
    title: 'Trending Now',
    data: [
      { id: '1', title: 'Wednesday', image: 'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg' },
      { id: '2', title: 'The Crown', image: 'https://image.tmdb.org/t/p/w500/7JFmPwvl1vNBvXeGKzytZ0pzJr1.jpg' },
      { id: '3', title: 'Bridgerton', image: 'https://image.tmdb.org/t/p/w500/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg' },
      { id: '4', title: 'Squid Game', image: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg' },
      { id: '5', title: 'The Witcher', image: 'https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg' },
    ]
  },
  {
    id: 'recommended',
    title: 'Recommended for You',
    data: [
      { id: '6', title: 'Dark', image: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg' },
      { id: '7', title: 'Money Heist', image: 'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg' },
      { id: '8', title: 'The Queen\'s Gambit', image: 'https://image.tmdb.org/t/p/w500/zU0htwkhNvBQdVSIKB9s6hgVeFK.jpg' },
      { id: '9', title: 'Ozark', image: 'https://image.tmdb.org/t/p/w500/m73bD8VjibSKuTWg597GQVyVhSb.jpg' },
    ]
  },
  {
    id: 'original',
    title: 'Netflix Originals',
    isLarge: true,
    data: [
      { id: '10', title: 'The Sandman', image: 'https://image.tmdb.org/t/p/w500/q54qEgagGOYCq5D1903eBVMNkbo.jpg' },
      { id: '11', title: 'Shadow and Bone', image: 'https://image.tmdb.org/t/p/w500/mrVoyDFiDSqfH4mZaHk8xKycGko.jpg' },
      { id: '12', title: '1899', image: 'https://image.tmdb.org/t/p/w500/8KGvYHQNOamON6ufQGjyhkiVn1V.jpg' },
    ]
  },
  {
    id: 'comedies',
    title: 'Comedies',
    data: [
      { id: '13', title: 'Friends', image: 'https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg' },
      { id: '14', title: 'Brooklyn Nine-Nine', image: 'https://image.tmdb.org/t/p/w500/yMEzsYvGqRCCKP5QaYt8ZX4l2Jj.jpg' },
      { id: '15', title: 'The Office', image: 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg' },
    ]
  },
  {
    id: 'documentaries',
    title: 'Documentaries',
    data: [
      { id: '16', title: 'Our Planet', image: 'https://image.tmdb.org/t/p/w500/wXPYMvLIIrGLilgpgxAimKKLsGH.jpg' },
      { id: '17', title: 'Making a Murderer', image: 'https://image.tmdb.org/t/p/w500/ndeOKIzB0TZCnWheEMJJQa8yXOF.jpg' },
      { id: '18', title: 'Tiger King', image: 'https://image.tmdb.org/t/p/w500/pmjYMCnSwndlEpiFZhhOWSWmUvl.jpg' },
    ]
  }
];

// Add error handling for images
const ImageWithFallback = ({ path, style, fallbackStyle }) => {
  const [imageError, setImageError] = useState(false);
  const [currentSize, setCurrentSize] = useState('w500');
  
  // Reset error state when path changes
  useEffect(() => {
    setImageError(false);
    setCurrentSize('w500');
  }, [path]);

  // If no path at all, show placeholder
  if (!path) {
    return (
      <View style={[style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999' }}>No Image</Text>
      </View>
    );
  }
  
  // If we've tried all sizes and still have errors, show placeholder
  if (imageError && currentSize === 'w92') {
    return (
      <View style={[fallbackStyle || style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999' }}>No Image</Text>
      </View>
    );
  }
  
  // Get next size down if current size fails
  const getNextSize = (size) => {
    const sizes = ['w500', 'w342', 'w185', 'w92'];
    const currentIndex = sizes.indexOf(size);
    return currentIndex < sizes.length - 1 ? sizes[currentIndex + 1] : 'w92';
  };
  
  return (
    <Image
      source={{ uri: `https://image.tmdb.org/t/p/${currentSize}${path}` }}
      style={style}
      onError={() => {
        console.log(`Image error for size ${currentSize}, trying smaller size`);
        if (currentSize !== 'w92') {
          setCurrentSize(getNextSize(currentSize));
        } else {
          setImageError(true);
        }
      }}
    />
  );
};

// Create a MovieModal component
const MovieModal = ({ movie, visible, onClose, onMovieAction }) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { addToWatchList, removeFromWatchList } = useContext(WatchListContext);
  const currentUserId = user?.userId || 1; // Default user ID, replace with actual user ID from auth context
  
  useEffect(() => {
    // Check if the movie is in the user's watchlist
    const checkWatchlist = async () => {
      if (movie && movie.id) {
        try {
          const result = await isInWatchlist(currentUserId, movie.id);
          setInWatchlist(result);
        } catch (error) {
          console.error('Error checking watchlist:', error);
        }
      }
    };
    
    checkWatchlist();
  }, [movie, currentUserId]);
  
  const handleAddToWatchlist = async () => {
    if (!movie) return;
    
    setLoading(true);
    try {
      // Call the API directly through the service function
      const result = await addToWatchlist(currentUserId, movie.id, movie.title);
      console.log('Added to watchlist API response:', result);
      
      setInWatchlist(true);
      Alert.alert('Success', 'Added to your watchlist');
      
      // Notify parent component that action was performed
      if (onMovieAction) {
        onMovieAction('watchlist', movie.id);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      Alert.alert('Error', 'Failed to add to watchlist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveFromWatchlist = async () => {
    if (!movie) return;
    
    setLoading(true);
    try {
      // Use the service function directly instead of the context function
      await removeFromWatchlist(currentUserId, movie.id);
      setInWatchlist(false);
      Alert.alert('Success', 'Removed from your watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      Alert.alert('Error', 'Failed to remove from watchlist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleWatch = async () => {
    if (!movie) return;
    
    setLoading(true);
    try {
      // Call the API directly through the service function
      const result = await addToWatchHistory(currentUserId, movie.id);
      console.log('Added to watch history API response:', result);
      
      Alert.alert('Success', 'Added to your watch history');
      
      // Notify parent component that action was performed
      if (onMovieAction) {
        onMovieAction('watched', movie.id);
      }
      
      onClose(); // Close modal after watching
    } catch (error) {
      console.error('Error adding to watch history:', error);
      Alert.alert('Error', 'Failed to add to watch history');
    } finally {
      setLoading(false);
    }
  };

  if (!movie) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={onClose}
      >
        <Pressable 
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
        >
          <ImageWithFallback
            path={movie.image?.startsWith('http') ? movie.image : movie.poster_path}
            style={styles.modalImage}
            fallbackStyle={styles.modalImageFallback}
          />
          <ScrollView style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{movie.title}</Text>
            
            <View style={styles.modalMetadata}>
              <Text style={styles.modalYear}>{movie.year || (movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'N/A')}</Text>
              <Text style={styles.modalDot}>•</Text>
              <Text style={styles.modalRating}>★ {movie.rating || 'N/A'}</Text>
            </View>

            <Text style={styles.modalDescription}>
              {movie.description}
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.watchButton]}
                onPress={handleWatch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="play" size={18} color="#FFF" />
                    <Text style={styles.watchButtonText}>Watch</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, inWatchlist ? styles.removeButton : styles.addButton]}
                onPress={inWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name={inWatchlist ? "remove" : "add"} size={18} color="#FFF" />
                    <Text style={styles.addButtonText}>
                      {inWatchlist ? 'Remove from List' : 'Add to List'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// The MovieImage component
const MovieImage = ({ movie }) => {
  const [imgSrc, setImgSrc] = useState(movie?.image || '');

  const handleImageError = () => {
    if (imgSrc.includes('original')) {
      setImgSrc(imgSrc.replace('original', 'w500'));
    } else if (imgSrc.includes('w500')) {
      setImgSrc(imgSrc.replace('w500', 'w342'));
    } else if (imgSrc.includes('w342')) {
      setImgSrc(imgSrc.replace('w342', 'w185'));
    } else {
      setImgSrc(`https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie?.title || 'Movie')}`);
    }
  };

  return (
    <Image
      source={{ uri: imgSrc }}
      style={styles.movieImage}
      onError={handleImageError}
    />
  );
};

// First, create a movie context at the top level
const MovieContext = React.createContext();

// Then create a provider component
const MovieProvider = ({ children }) => {
  const [allMovies, setAllMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [friendRecommendations, setFriendRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch all movies on component mount
  useEffect(() => {
    fetchMovies();
  }, []);

  // Load recommended movies when user changes
  useEffect(() => {
    if (user && user.userId) {
      fetchUserRecommendations(user.userId);
      fetchFriendRecommendations(user.userId);
    }
  }, [user]);

  // Fetch all movies
  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const data = await getMovies();
      if (data && data.movies) {
        setAllMovies(data.movies);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to fetch movies');
      setIsLoading(false);
    }
  };

  // Fetch user recommendations
  const fetchUserRecommendations = async (userId) => {
    try {
      const data = await getUserRecommendations(userId);
      if (data && data.recommendations) {
        setRecommendedMovies(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching user recommendations:', error);
    }
  };
  
  // Fetch friend recommendations
  const fetchFriendRecommendations = async (userId) => {
    try {
      const data = await getFriendRecommendations(userId);
      if (data && data.recommendations) {
        setFriendRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching friend recommendations:', error);
    }
  };

  // Update user recommendations
  const handleUpdateUserRecommendations = async (userId, movieId, like) => {
    try {
      await updateUserRecommendations(userId, movieId, like);
    } catch (error) {
      console.error('Error updating user recommendations:', error);
    }
  };

  return (
    <MovieContext.Provider
      value={{
        allMovies,
        recommendedMovies,
        friendRecommendations,
        isLoading,
        error,
        fetchMovies,
        fetchUserRecommendations,
        fetchFriendRecommendations,
        updateUserRecommendations: handleUpdateUserRecommendations
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

// Replace the existing HomeScreen with this enhanced version
const HomeScreen = ({ navigation }) => {
  const { allMovies } = useContext(MovieContext);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.userId || 1;
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [friendRecommendations, setFriendRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFriendRecs, setHasFriendRecs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Function to load friend recommendations
  const loadFriendRecommendations = useCallback(async () => {
    try {
      const data = await getFriendRecommendations(currentUserId);
      if (data.recommendations && data.recommendations.length > 0) {
        setFriendRecommendations(data.recommendations);
        setHasFriendRecs(true);
      } else {
        setFriendRecommendations([]);
        setHasFriendRecs(false);
      }
    } catch (err) {
      console.error('Failed to load friend recommendations:', err);
      setFriendRecommendations([]);
      setHasFriendRecs(false);
    }
  }, [currentUserId]);
  
  // Function to load recommendations
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserRecommendations(currentUserId);
      setFeatured(data.featured);
      setCategories(data.categories);
      
      // Also load friend recommendations
      await loadFriendRecommendations();
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('Failed to load content. Please try again.');
      setLoading(false);
      
      // Fallback to regular movies if recommendations fail
      try {
        const fallbackData = await getMovies();
        setFeatured(fallbackData.featured);
        setCategories(fallbackData.categories);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  }, [currentUserId, loadFriendRecommendations]);
  
  // Function to update recommendations
  const updateRecommendations = useCallback(async () => {
    try {
      setRefreshing(true);
      await updateUserRecommendations(currentUserId);
      await loadRecommendations();
      setRefreshing(false);
    } catch (err) {
      console.error('Failed to update recommendations:', err);
      setError('Failed to update recommendations. Please try again.');
      setRefreshing(false);
    }
  }, [currentUserId, loadRecommendations]);
  
  // Load recommendations on initial render
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);
  
  // Refresh recommendations when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [loadRecommendations])
  );
  
  // Pull to refresh function
  const onRefresh = useCallback(() => {
    updateRecommendations();
  }, [updateRecommendations]);
  
  // Handle movie selection
  const handleMoviePress = useCallback((movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  }, []);
  
  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);
  
  // Handle movie action (added to watchlist or watched)
  const handleMovieAction = useCallback((action, movieId) => {
    console.log(`Movie ${movieId} was ${action}`);
    
    // Refresh recommendations to get new content excluding this movie
    loadRecommendations();
    
    // Remove the movie from the current categories and featured area
    if (featured && featured.id === movieId) {
      setFeatured(null);
    }
    
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        data: category.data.filter(movie => movie.id !== movieId)
      }))
    );
  }, [featured, loadRecommendations]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }
  
  if (error && !featured && categories.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#E50914"]}
          tintColor="#E50914"
        />
      }
    >
      {/* Featured Content */}
      {featured && (
        <TouchableOpacity
          style={styles.featuredContainer}
          onPress={() => handleMoviePress(featured)}
        >
          <ImageWithFallback
            path={featured.image?.startsWith('http') ? featured.image : featured.poster_path}
            style={styles.featuredImage}
            fallbackStyle={styles.featuredImageFallback}
          />
          <View style={styles.featuredGradient} />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredDescription} numberOfLines={3}>
              {featured.description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => handleMoviePress(featured)}
              >
                <Icon name="play" size={22} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.listButton}
                onPress={() => handleMoviePress(featured)}
              >
                <Icon name="add" size={24} color="#FFF" />
                <Text style={styles.listButtonText}>My List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Movie Categories */}
      {categories.map((category) => (
        category.data.length > 0 && (
          <View key={category.id} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <FlatList
              horizontal
              data={category.data}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.movieItem,
                    category.isLarge && styles.largeMovieItem
                  ]}
                  onPress={() => handleMoviePress(item)}
                >
                  <ImageWithFallback
                    path={item.image?.startsWith('http') ? item.image : item.poster_path}
                    style={[
                      styles.movieImage,
                      category.isLarge && styles.largeMovieImage
                    ]}
                    fallbackStyle={[
                      styles.movieImageFallback,
                      category.isLarge && styles.largeMovieImageFallback
                    ]}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )
      ))}

      {/* Friend Recommendations Section */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>Friend Recommendations</Text>
        {hasFriendRecs ? (
          <FlatList
            horizontal
            data={friendRecommendations}
            keyExtractor={(item) => `friend-${item.id.toString()}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.movieItem}
                onPress={() => handleMoviePress(item)}
              >
                <ImageWithFallback
                  path={item.image?.startsWith('http') ? item.image : item.poster_path}
                  style={styles.movieImage}
                  fallbackStyle={styles.movieImageFallback}
                />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyFriendRecsContainer}>
            <Icon name="people" size={40} color="#666" />
            <Text style={styles.emptyFriendRecsText}>
              Your friends haven't watched anything yet
            </Text>
          </View>
        )}
      </View>

      {/* Update Recommendations Button */}
      <TouchableOpacity 
        style={styles.updateButton}
        onPress={updateRecommendations}
        disabled={refreshing}
      >
        <Text style={styles.updateButtonText}>
          {refreshing ? 'Updating...' : 'Update Recommendations'}
        </Text>
      </TouchableOpacity>
      
      {/* Movie Detail Modal */}
      <MovieModal
        movie={selectedMovie}
        visible={modalVisible}
        onClose={handleCloseModal}
        onMovieAction={handleMovieAction}
      />
    </ScrollView>
  );
};

// Replace the simple SearchScreen with this new version
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term.trim().length >= 2) {
        performSearch(term);
      } else if (term.trim() === '') {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500),
    []
  );
  
  const performSearch = async (term) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const url = `http://localhost:3001/api/search?term=${encodeURIComponent(term)}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error details:', err);
      setError(`Failed to search: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };
  
  const handleMoviePress = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  const handleMovieAction = (action, movieId) => {
    // After movie action (e.g., adding to watchlist), you might want to update UI
    console.log(`Movie action: ${action} for movie ${movieId}`);
  };
  
  const renderMovie = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => handleMoviePress(item)}
    >
      <View style={styles.movieImageContainer}>
        <ImageWithFallback 
          path={item.image?.startsWith('http') ? item.image : item.poster_path} 
          style={styles.movieImage}
          fallbackStyle={styles.movieImageFallback}
        />
      </View>
      <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
      {item.year || item.releaseDate ? (
        <Text style={styles.movieYear}>
          {item.year || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'N/A')}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
  
  // Function to help debounce search requests
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shows and movies..."
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={clearSearch}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconFeather name="alert-circle" size={50} color="#E50914" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => performSearch(searchQuery)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          numColumns={3}
          contentContainerStyle={styles.moviesGrid}
          columnWrapperStyle={styles.movieRow}
        />
      ) : hasSearched ? (
        <View style={styles.noResults}>
          <Icon name="search-outline" size={50} color="#666" />
          <Text style={styles.noResultsText}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      ) : (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchText}>
            Type at least 2 characters to search
          </Text>
        </View>
      )}
      
      <MovieModal
        movie={selectedMovie}
        visible={modalVisible}
        onClose={handleCloseModal}
        onMovieAction={handleMovieAction}
      />
    </View>
  );
};

// Create a context for the watch list
const WatchListContext = React.createContext();

// Create WatchListProvider
export const WatchListProvider = ({ children }) => {
  const [watchList, setWatchList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  
  // Function to fetch user's watchlist from the database
  const fetchWatchlist = useCallback(async () => {
    if (!user || !user.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = user.userId;
      const response = await fetch(`http://localhost:3001/api/watchlist/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      
      const data = await response.json();
      setWatchList(data.watchlist || []);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Initial fetch when user is available
  useEffect(() => {
    if (user && user.userId) {
      fetchWatchlist();
    }
  }, [user, fetchWatchlist]);
  
  // Add movie to watchlist
  const addToWatchList = useCallback(async (movie) => {
    if (!user || !user.userId || !movie || !movie.id) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.userId, 
          movieId: movie.id 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }
      
      // Update local state only if API call was successful
      setWatchList(prev => {
        // Check if movie is already in watchlist
        const exists = prev.some(item => item.id === movie.id);
        if (!exists) {
          return [...prev, movie];
        }
        return prev;
      });
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  }, [user]);
  
  // Remove movie from watchlist
  const removeFromWatchList = useCallback(async (movieId) => {
    if (!user || !user.userId || !movieId) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.userId, 
          movieId: movieId 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }
      
      // Update local state only if API call was successful
      setWatchList(prev => prev.filter(movie => movie.id !== movieId));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  }, [user]);

  return (
    <WatchListContext.Provider value={{ 
      watchList, 
      setWatchList,
      addToWatchList, 
      removeFromWatchList, 
      fetchWatchlist,
      isLoading,
      error 
    }}>
      {children}
    </WatchListContext.Provider>
  );
};

// Update ProfileScreen
const ProfileScreen = ({ navigation }) => {
  const { watchList, fetchWatchlist, removeFromWatchList, isLoading: watchlistLoading, error: watchlistError } = useContext(WatchListContext);
  const { user, logout } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: 'Loading...',
    gender: '',
    birthday: '',
    avatar: 'https://i.pravatar.cc/150?img=8',
    plan: 'Premium',
    joinDate: 'Member since January 2024'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' or 'friends'
  const [friends, setFriends] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  console.log('ProfileScreen rendering, activeTab:', activeTab);
  
  // Log when tabs are switched
  const switchTab = (tab) => {
    console.log('Switching to tab:', tab);
    setActiveTab(tab);
  };
  
  // Refresh watchlist when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWatchlist();
      fetchFriends();
    }, [fetchWatchlist])
  );
  
  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      if (!user || !user.token) return;
      
      try {
        const response = await fetch('http://localhost:3001/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        setUserInfo({
          ...userInfo,
          email: data.user.email,
          gender: data.user.gender || 'Not specified',
          birthday: data.user.birthday ? new Date(data.user.birthday).toLocaleDateString() : 'Not specified',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const fetchFriends = async () => {
    if (!user || !user.userId) return;
    
    setFriendsLoading(true);
    setFriendsError(null);
    
    try {
      const response = await getFriends(user.userId);
      setFriends(response.friends || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriendsError('Failed to load friends');
    } finally {
      setFriendsLoading(false);
    }
  };
  
  const handleSearchFriends = async () => {
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const response = await searchUsersByEmail(searchEmail.trim());
      setSearchResults(response.users.filter(u => u.user_id !== user.userId) || []);
    } catch (err) {
      console.error('Error searching users:', err);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddFriend = async (friendId) => {
    if (!user || !user.userId) return;
    
    try {
      await addFriend(user.userId, friendId);
      Alert.alert('Success', 'Friend added successfully');
      // Clear search and refresh friends list
      setSearchEmail('');
      setSearchResults([]);
      fetchFriends();
    } catch (err) {
      console.error('Error adding friend:', err);
      Alert.alert('Error', err.message || 'Failed to add friend');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };
  
  const handlePlayMovie = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  };
  
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  const handleMovieAction = (action, movieId) => {
    console.log(`Movie action: ${action} for movie ${movieId}`);
    // If necessary, refresh watchlist after action
    if (action === 'watchlist') {
      fetchWatchlist();
    }
  };
  
  const handleRemoveFromWatchlist = (movieId) => {
    // Use the context function to remove from watchlist
    removeFromWatchList(movieId);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconFeather name="alert-circle" size={50} color="#E50914" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.profileContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: userInfo.avatar }} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userInfo.email}</Text>
            <Text style={styles.profilePlan}>{userInfo.plan}</Text>
            <Text style={styles.profileDate}>Birthday: {userInfo.birthday}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Buttons */}
        <View style={styles.tabButtonContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'watchlist' && styles.activeTabBtn]} 
            onPress={() => switchTab('watchlist')}
          >
            <Icon name="film-outline" size={24} color={activeTab === 'watchlist' ? '#E50914' : '#AAA'} />
            <Text style={[styles.tabBtnText, activeTab === 'watchlist' && styles.activeTabBtnText]}>
              Watchlist
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'friends' && styles.activeTabBtn]} 
            onPress={() => switchTab('friends')}
          >
            <Icon name="people-outline" size={24} color={activeTab === 'friends' ? '#E50914' : '#AAA'} />
            <Text style={[styles.tabBtnText, activeTab === 'friends' && styles.activeTabBtnText]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'watchlist' ? (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>My Watchlist</Text>
              {watchlistLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#E50914" />
                  <Text style={styles.loadingText}>Loading watchlist...</Text>
                </View>
              ) : watchlistError ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={50} color="#E50914" />
                  <Text style={styles.errorText}>{watchlistError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchWatchlist}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : watchList.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Icon name="film-outline" size={50} color="#666" />
                  <Text style={styles.emptyListText}>No movies in your watchlist</Text>
                  <Text style={styles.emptyListSubText}>Add movies from the Discover or Search tabs</Text>
                </View>
              ) : (
                <View style={styles.moviesGrid}>
                  {watchList.map((movie) => (
                    <TouchableOpacity 
                      key={movie.id.toString()} 
                      style={styles.movieCard}
                      onPress={() => handlePlayMovie(movie)}
                    >
                      <View style={styles.movieImageContainer}>
                        <ImageWithFallback 
                          path={movie.image?.startsWith('http') ? movie.image : movie.poster_path}
                          style={styles.movieImage}
                          fallbackStyle={styles.movieImageFallback}
                        />
                      </View>
                      <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
                      <Text style={styles.movieYear}>
                        {movie.year || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A')}
                      </Text>
                      <TouchableOpacity 
                        style={styles.removeIconButton}
                        onPress={() => handleRemoveFromWatchlist(movie.id)}
                      >
                        <Icon name="close-circle" size={24} color="#E50914" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>Find Friends</Text>
              
              <View style={styles.friendsSearchBar}>
                <TextInput
                  style={styles.friendsSearchInput}
                  placeholder="Search friends by email..."
                  placeholderTextColor="#999"
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearchFriends}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
              
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#E50914" />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              )}
              
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <Text style={styles.searchResultsTitle}>Found Users:</Text>
                  {searchResults.map(user => (
                    <View key={user.user_id} style={styles.searchResultItem}>
                      <View style={styles.searchResultAvatar}>
                        <Text style={styles.searchResultAvatarText}>{user.email.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <TouchableOpacity 
                        style={styles.addButton} 
                        onPress={() => handleAddFriend(user.user_id)}
                      >
                        <Text style={styles.addButtonText}>Add Friend</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {searchResults.length === 0 && searchEmail.length > 0 && !isSearching && (
                <View style={styles.emptyStateContainer}>
                  <Icon name="search" size={50} color="#666" />
                  <Text style={styles.noResultsText}>No users found matching "{searchEmail}"</Text>
                </View>
              )}
              
              <Text style={[styles.sectionTitle, {marginTop: 20}]}>My Friends</Text>
              
              {friendsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#E50914" />
                  <Text style={styles.loadingText}>Loading friends...</Text>
                </View>
              ) : friendsError ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={50} color="#E50914" />
                  <Text style={styles.errorText}>{friendsError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchFriends}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : friends.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Icon name="people" size={50} color="#666" />
                  <Text style={styles.emptyListText}>You don't have any friends yet</Text>
                  <Text style={styles.emptyListSubText}>Use the search above to find and add friends</Text>
                </View>
              ) : (
                <View>
                  {friends.map(item => (
                    <View key={item.user_id.toString()} style={styles.friendItem}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>{item.email.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.friendEmail}>{item.email}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <MovieModal
        movie={selectedMovie}
        visible={modalVisible}
        onClose={handleCloseModal}
        onMovieAction={handleMovieAction}
      />
    </View>
  );
};

// Define sample movies to use as fallback when API data is not available
const SWIPE_MOVIES = [
  {
    id: 'sample1',
    title: 'Stranger Things',
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
    image: 'https://image.tmdb.org/t/p/w500/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    releaseDate: '2016-07-15',
    rating: '8.7'
  },
  {
    id: 'sample2',
    title: 'The Matrix',
    description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    image: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    releaseDate: '1999-03-31',
    rating: '8.4'
  },
  {
    id: 'sample3',
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    releaseDate: '2010-07-16',
    rating: '8.8'
  },
  {
    id: 'sample4',
    title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    image: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    releaseDate: '1994-09-23',
    rating: '9.3'
  },
  {
    id: 'sample5',
    title: 'Pulp Fiction',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    image: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    releaseDate: '1994-10-14',
    rating: '8.9'
  }
];

const DiscoverScreen = ({ navigation }) => {
  const { allMovies, recommendedMovies, isLoading, error, fetchMovies } = useContext(MovieContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useContext(AuthContext);
  const { watchList, setWatchList } = useContext(WatchListContext);
  const currentUserId = user?.userId || 1; // Default user ID, replace with actual user ID from auth
  const [discoverMovies, setDiscoverMovies] = useState([]);
  const [friendRecommendations, setFriendRecommendations] = useState([]);
  const [lastDirection, setLastDirection] = useState(null);
  
  // Refs for handling card movement
  const panResponderRef = useRef(null);
  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.9)).current;

  // Load friend recommendations
  const loadFriendRecommendations = useCallback(async () => {
    try {
      const data = await getFriendRecommendations(currentUserId);
      if (data.recommendations && data.recommendations.length > 0) {
        setFriendRecommendations(data.recommendations);
        return data.recommendations;
      }
      return [];
    } catch (err) {
      console.error('Failed to load friend recommendations:', err);
      return [];
    }
  }, [currentUserId]);

  useEffect(() => {
    // Load movies when component mounts
    const initializeDiscoverMovies = async () => {
      // First load friend recommendations
      const friendRecs = await loadFriendRecommendations();
      
      if (allMovies && allMovies.length > 0) {
        // Start with basic movie pool
        let moviePool = [...allMovies];
        
        // First prioritize user's recommended movies
        if (recommendedMovies && recommendedMovies.length > 0) {
          const userRecsNonDuplicates = recommendedMovies.filter(
            rec => !moviePool.some(movie => movie.id === rec.id)
          );
          moviePool = [...userRecsNonDuplicates, ...moviePool];
          console.log(`Prioritizing ${userRecsNonDuplicates.length} user recommended movies`);
        }
        
        // Then mix in some friend recommendations (if available)
        if (friendRecs.length > 0) {
          const friendRecsNonDuplicates = friendRecs.filter(
            frec => !moviePool.some(movie => movie.id === frec.id)
          );
          
          // Select about 30% of friend recommendations to mix in
          const selectedFriendRecs = friendRecsNonDuplicates
            .sort(() => Math.random() - 0.5)  // Shuffle them
            .slice(0, Math.max(3, Math.floor(friendRecsNonDuplicates.length * 0.3)));
            
          // Insert friend recommendations at random positions in the first 15 movies
          const firstBatch = moviePool.slice(0, 15);
          const remainingBatch = moviePool.slice(15);
          
          // Mix friend recommendations into first batch
          selectedFriendRecs.forEach(movie => {
            const insertPosition = Math.floor(Math.random() * (firstBatch.length + 1));
            firstBatch.splice(insertPosition, 0, movie);
          });
          
          moviePool = [...firstBatch, ...remainingBatch];
          console.log(`Mixed in ${selectedFriendRecs.length} friend recommendations`);
        }
        
        // Final shuffle for variety
        const shuffled = moviePool.sort(() => Math.random() - 0.5);
        setDiscoverMovies(shuffled);
        console.log(`Loaded ${shuffled.length} movies for discover`);
      } else {
        // Fallback to sample movies
        setDiscoverMovies(SWIPE_MOVIES);
        console.log("Using fallback movies");
      }
    };
    
    initializeDiscoverMovies();
    
    // Reset position when currentIndex changes
    resetPosition();
  }, [allMovies, recommendedMovies, loadFriendRecommendations]);

  useEffect(() => {
    // Create the pan responder for drag gestures
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        // Determine swipe direction based on velocity and distance
        if (gesture.dx > 120) {
          swipeRight();
        } else if (gesture.dx < -120) {
          swipeLeft();
        } else {
          resetPosition();
        }
      }
    });
  }, [currentIndex, discoverMovies]);

  // Reset the card position
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
    
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    Animated.spring(nextCardScale, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  // Swipe the card left
  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -500, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      swiped('left', discoverMovies[currentIndex]);
      resetPosition();
    });
  };

  // Swipe the card right
  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: 500, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      swiped('right', discoverMovies[currentIndex]);
      resetPosition();
    });
  };

  const swiped = async (direction, movie) => {
    console.log(`Swiped ${direction} on:`, movie ? movie.title : 'unknown movie');
    setLastDirection(direction);
    
    if (!movie || !movie.id) {
      console.error('Invalid movie object:', movie);
      return;
    }
    
    if (direction === 'right') {
      console.log(`Adding to watchlist: ${movie.title} (ID: ${movie.id})`);
      try {
        // Call the API directly through the service function
        const result = await addToWatchlist(currentUserId, movie.id, movie.title);
        console.log('Watchlist API response:', result);
        
        // Update the local state after successful API call
        if (result) {
          // Add to the UI state
          setWatchList(prev => {
            // Check if movie is already in watchlist
            const exists = prev.some(item => item.id === movie.id);
            if (!exists) {
              return [...prev, movie];
            }
            return prev;
          });
          console.log(`Successfully added ${movie.title} to watchlist`);
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
      }
    } else if (direction === 'left') {
      console.log(`Marking as not recommended: ${movie.title} (ID: ${movie.id})`);
      try {
        // Call the addToNotRecommended service function
        const result = await addToNotRecommended(currentUserId, movie.id, movie.title);
        if (result && result.success) {
          console.log(`Successfully marked ${movie.title} as not recommended`);
        }
      } catch (error) {
        console.error('Error marking as not recommended:', error);
      }
    }
    
    // Move to next card
    setCurrentIndex(prevIndex => prevIndex + 1);
    
    // Load more movies if we're nearing the end
    if (currentIndex >= discoverMovies.length - 5) {
      console.log('Loading more discover movies...');
      loadMoreDiscoverMovies();
    }
  };

  // Card rotation based on drag position
  const rotate = position.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  // Transform style for the current card
  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotate }
    ],
    opacity: cardOpacity,
  };

  // Transform style for the next card
  const nextCardStyle = {
    transform: [
      { scale: nextCardScale },
    ],
    opacity: nextCardScale,
  };

  const loadMoreDiscoverMovies = () => {
    // If we have more movies in allMovies, add some to the discover deck
    if (allMovies && allMovies.length > 0) {
      console.log("Loading more discover movies from all movies");
      // Get random selection from allMovies that aren't already in discoverMovies
      const currentMovieIds = new Set(discoverMovies.map(m => m.id));
      const availableMovies = allMovies.filter(m => !currentMovieIds.has(m.id));
      
      if (availableMovies.length > 0) {
        // Shuffle and take up to 10 movies
        const moreMovies = [...availableMovies]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        
        console.log(`Adding ${moreMovies.length} more movies to discover deck`);
        setDiscoverMovies(prevMovies => [...prevMovies, ...moreMovies]);
      } else {
        console.log("No more unique movies available. Reshuffling existing movies.");
        const shuffled = [...allMovies].sort(() => Math.random() - 0.5);
        setDiscoverMovies(prevMovies => [...prevMovies, ...shuffled.slice(0, 5)]);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading movies to discover...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#E50914" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (discoverMovies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="film" size={50} color="#E50914" />
        <Text style={styles.emptyText}>No movies available for discovery</Text>
      </View>
    );
  }

  // End of cards
  if (currentIndex >= discoverMovies.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="checkmark-circle" size={50} color="#4CAF50" />
        <Text style={styles.emptyText}>You've seen all movies!</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            // Reshuffle movies
            const shuffled = [...allMovies].sort(() => Math.random() - 0.5);
            setDiscoverMovies(shuffled);
            setCurrentIndex(0);
          }}
        >
          <Text style={styles.retryButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.discoverContainer}>
      <Text style={styles.discoverTitle}>Discover Movies</Text>
      <Text style={styles.discoverSubtitle}>Swipe right to add to your list, left to skip</Text>
      
      <View style={styles.cardContainer}>
        {/* Next card (shows behind current card) */}
        {currentIndex + 1 < discoverMovies.length && (
          <Animated.View 
            style={[styles.cardWrapper, nextCardStyle, { zIndex: 0 }]}
          >
            <View style={styles.card}>
              <Image
                source={{ uri: discoverMovies[currentIndex + 1].image }}
                style={styles.cardImage}
                onError={() => console.log(`Image error for ${discoverMovies[currentIndex + 1].title}`)}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{discoverMovies[currentIndex + 1].title}</Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {discoverMovies[currentIndex + 1].description || 'No description available'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Current card (top card that can be swiped) */}
        <Animated.View 
          {...panResponderRef.current?.panHandlers}
          style={[styles.cardWrapper, cardStyle, { zIndex: 1 }]}
        >
          <View style={styles.card}>
            <Image
              source={{ uri: discoverMovies[currentIndex].image }}
              style={styles.cardImage}
              onError={() => console.log(`Image error for ${discoverMovies[currentIndex].title}`)}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{discoverMovies[currentIndex].title}</Text>
              <Text style={styles.cardYear}>{discoverMovies[currentIndex].releaseDate ? new Date(discoverMovies[currentIndex].releaseDate).getFullYear() : 'N/A'}</Text>
              <Text style={styles.cardDescription} numberOfLines={3}>
                {discoverMovies[currentIndex].description || 'No description available'}
              </Text>
              {/* For debugging - check movie object structure */}
              {currentIndex < discoverMovies.length && console.log('Current movie object:', JSON.stringify(discoverMovies[currentIndex]))}
            </View>
          </View>
        </Animated.View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonDislike]}
          onPress={swipeLeft}
        >
          <Icon name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.buttonLike]} 
          onPress={swipeRight}
        >
          <Icon name="heart" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {lastDirection && (
        <View style={styles.swipeIndicator}>
          <Text style={styles.swipeText}>
            {lastDirection === 'right' ? 'Added to watchlist' : 'Not interested'}
          </Text>
        </View>
      )}
    </View>
  );
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Add LoginScreen component
const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store authentication data
      login(data.token, data.userId);
      navigation.replace('Main');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.loginContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>NETFLIX</Text>
      </View>
      
      <View style={styles.formContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>New to Netflix? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Add this new context for authentication
const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      setUser({ token, userId });
    }
    setIsLoading(false);
  }, []);
  
  const login = (token, userId) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', userId);
    setUser({ token, userId });
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this gender selection component
const GenderSelector = ({ selectedGender, onSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const genderOptions = ['male', 'female', 'other'];
  
  return (
    <View>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedGender ? styles.inputText : styles.inputPlaceholder}>
          {selectedGender || 'Select Gender (optional)'}
        </Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.genderModalContent}>
            <Text style={styles.genderModalTitle}>Select Gender</Text>
            
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderOption,
                  selectedGender === option && styles.genderOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  setModalVisible(false);
                }}
              >
                <Text style={[
                  styles.genderOptionText,
                  selectedGender === option && styles.genderOptionTextSelected
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Add this DatePicker component to your App.js
const DatePicker = ({ selectedDate, onSelect, placeholder }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  return (
    <View>
      <TouchableOpacity 
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text style={selectedDate ? styles.inputText : styles.inputPlaceholder}>
          {selectedDate ? formatDate(selectedDate) : placeholder || 'Select Date (optional)'}
        </Text>
        <Icon name="calendar" size={20} color="#666" />
      </TouchableOpacity>
      
      {showPicker && (
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Birthday</Text>
          </View>
          
          {/* Simple date picker for web */}
          <input
            type="date"
            value={selectedDate ? formatDate(selectedDate) : ''}
            onChange={(e) => {
              onSelect(e.target.value);
              setTimeout(() => setShowPicker(false), 300); // Close after selection
            }}
            style={{
              backgroundColor: '#333',
              color: 'white',
              padding: 10,
              borderRadius: 5,
              border: 'none',
              fontSize: 16,
              width: '100%'
            }}
          />
          
          <View style={styles.datePickerFooter}>
            <TouchableOpacity 
              style={styles.datePickerCancel}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Now update the SignupScreen component
const SignupScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, gender, birthday }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      // Login the user with the returned token
      login(data.token, data.userId);
      navigation.replace('Main');
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.loginContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>NETFLIX</Text>
      </View>
      
      <View style={styles.formContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <GenderSelector 
          selectedGender={gender} 
          onSelect={setGender} 
        />
        
        <DatePicker
          selectedDate={birthday}
          onSelect={setBirthday}
          placeholder="Birthday (optional)"
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signupLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Update App component to include LoginScreen
const App = () => {
  return (
    <AuthProvider>
      <MovieProvider>
        <WatchListProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Signup" 
                component={SignupScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Main" 
                component={HomeTabs} 
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WatchListProvider>
      </MovieProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
  container: {
    flex: 1, 
    backgroundColor: '#000',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  tabContentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabSection: {
    backgroundColor: '#000',
    marginBottom: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    height: 500,
    backgroundColor: '#333',
    borderRadius: 10,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
    backgroundColor: '#222',
  },
  cardContent: {
    padding: 15,
    flex: 1,
  },
  cardTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardMetadata: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  cardYear: {
    color: '#999',
    marginRight: 10,
  },
  cardRating: {
    color: '#ffd700',
  },
  cardDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  noMoreCards: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    maxWidth: 300,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skipButton: {
    backgroundColor: '#ff4d4d',
  },
  watchButton: {
    backgroundColor: '#4dd964',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100vh',
    color: 'white',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  resultsList: {
    padding: 7,
    width: '100%',
  },
  row: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 5,
    width: '100%',
  },
  showItem: {
    width: '100%',
    marginHorizontal: 2,
    marginVertical: 5,
    alignItems: 'center',
  },
  showImageContainer: {
    width: '100%',
    marginBottom: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  showImage: {
    width: '100%',
    height: '100%',
  },
  showTitle: {
    color: 'white',
    marginTop: 3,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  showYear: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    color: 'gray',
    fontSize: 16,
  },
  featuredContainer: {
    height: Dimensions.get('window').height * 0.7,
    width: '100%',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  featuredTitle: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  featuredDescription: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000',
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  myListButton: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    alignItems: 'center',
  },
  myListButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  moviesSection: {
    marginVertical: 20,
    paddingLeft: 10,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  movieRow: {
    flexGrow: 0,
  },
  movieItem: {
    marginRight: 10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  movieImage: {
    width: 120,
    height: 180,
    borderRadius: 4,
    marginRight: 10,
  },
  movieImageLarge: {
    width: 160,
    height: 240,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    color: '#E50914',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    color: 'white',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: 'white',
    fontSize: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    color: '#999',
    marginBottom: 2,
  },
  profilePlan: {
    color: '#E50914',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileDate: {
    color: '#999',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
  watchListContainer: {
    flex: 1,
  },
  watchListTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  watchList: {
    flex: 1,
  },
  watchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  watchListItemImage: {
    width: 60,
    height: 90,
    borderRadius: 5,
  },
  watchListItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  watchListItemTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  watchListItemYear: {
    color: '#999',
  },
  watchListItemPlay: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#181818',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalImageFallback: {
    width: '100%',
    height: 300,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 20,
    maxHeight: 300,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalYear: {
    color: '#AAA',
    fontSize: 14,
  },
  modalDot: {
    color: '#AAA',
    marginHorizontal: 5,
  },
  modalRating: {
    color: '#AAA',
    fontSize: 14,
  },
  modalDescription: {
    color: '#CCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  watchButton: {
    backgroundColor: '#E50914',
  },
  watchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#333',
  },
  removeButton: {
    backgroundColor: '#555',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    flex: 1,
    justifyContent: 'center',
  },
  modalListButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalListButtonActive: {
    backgroundColor: '#555',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
  },
  discoverContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  discoverTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  discoverSubtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
    marginVertical: 20,
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 300,
    height: 450,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    color: '#ccc',
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    alignSelf: 'center',
    marginBottom: 30,
  },
  buttonDislike: {
    backgroundColor: '#E50914',
  },
  buttonLike: {
    backgroundColor: '#4CAF50',
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
  },
  swipeText: {
    color: '#fff',
    fontSize: 16,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 5,
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  inputText: {
    color: 'white',
    flex: 1,
  },
  inputPlaceholder: {
    color: '#666',
    flex: 1,
  },
  genderModalContent: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  genderModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  genderOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
  },
  genderOptionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  genderOptionTextSelected: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    marginBottom: 15,
  },
  datePickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datePickerFooter: {
    marginTop: 15,
    alignItems: 'center',
  },
  datePickerCancel: {
    padding: 10,
  },
  datePickerCancelText: {
    color: '#E50914',
    fontSize: 16,
  },
  detailsImageContainer: {
    width: '100%',
    height: 250,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Styles for recommendation screen
  updateButton: {
    backgroundColor: '#E50914',
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  categoryContainer: {
    marginTop: 20,
  },
  categoryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 10,
  },
  movieItem: {
    marginHorizontal: 5,
    width: 120,
    height: 180,
    borderRadius: 4,
    overflow: 'hidden',
  },
  largeMovieItem: {
    width: 160,
    height: 240,
  },
  movieImage: {
    width: '100%',
    height: '100%',
  },
  movieImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeMovieImage: {
    width: '100%',
    height: '100%',
  },
  largeMovieImageFallback: {
    width: '100%',
    height: '100%',
  },
  featuredImage: {
    width: '100%',
    height: 500,
    position: 'absolute',
  },
  featuredImageFallback: {
    width: '100%',
    height: 500,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGradient: {
    position: 'absolute',
    width: '100%',
    height: 500,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredContent: {
    padding: 20,
    marginTop: 300,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
  },
  // Additional styles for the updated watchlist UI
  watchListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  watchListItemImageFallback: {
    width: 80,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchListItemRating: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
  },
  watchListItemActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingVertical: 10,
  },
  watchListItemRemove: {
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
    padding: 10,
  },
  tabButton: {
    padding: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 120,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomColor: '#E50914',
  },
  tabButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  friendsContainer: {
    flex: 1,
    marginTop: 10,
  },
  friendsSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    backgroundColor: '#222',
    overflow: 'hidden',
    height: 45,
    width: '100%',
  },
  friendsSearchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  friendsSearchButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#E50914',
  },
  searchResultsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#222',
  },
  searchResultsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  userEmail: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListSubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  addButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#E50914',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    borderBottomWidth: 2,
    borderTopWidth: 2,
    borderColor: '#333',
    backgroundColor: '#222',
    padding: 15,
  },
  tabBtn: {
    padding: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 150,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    elevation: 5,
  },
  activeTabBtn: {
    backgroundColor: '#1C1C1C',
    borderBottomColor: '#E50914',
  },
  tabBtnText: {
    color: '#BBB',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  activeTabBtnText: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    backgroundColor: '#222',
    overflow: 'hidden',
    height: '90vh',
  },
  searchInput: {
    flex: 1,
    height: 50,
    width: '95vw',
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E50914',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#E50914',
    minWidth: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyFriendsContainer: {
    flex: 1,
    width: '20vw',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListSubText: {
    color: '#999',
    width: '20vw',
    fontSize: 14,
    textAlign: 'center',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    paddingHorizontal: 5,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#222',
    marginVertical: 5,
    borderRadius: 8,
  },
  friendEmail: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  emptyListText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  watchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#222',
    marginVertical: 5,
    borderRadius: 8,
  },
  movieTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  removeButton: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
  },
  friendsTabContainer: {
    flex: 1,
    padding: 20,
  },
  movieCard: {
    width: '10vw',
    margin: 25,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  movieImageContainer: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#222',
  },
  movieYear: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  movieRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  movieImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  movieImageFallback: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieTitle: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 5,
    fontWeight: 'bold',
  },
  removeIconButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  friendsSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    backgroundColor: '#222',
    overflow: 'hidden',
    height: 45,
    width: '100%',
  },
  friendsSearchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E50914',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyFriendRecsContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 5,
    marginHorizontal: 10,
    padding: 20,
  },
  emptyFriendRecsText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default App; 