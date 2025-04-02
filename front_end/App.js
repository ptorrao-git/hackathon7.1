import React, { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ScrollView, Dimensions, Animated, PanResponder, Modal, Pressable, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TinderCard from 'react-tinder-card';
import { getMovies } from './src/services/movieService';
import IconFeather from 'react-native-vector-icons/Feather';

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
const MovieModal = ({ movie, visible, onClose, onAddToList, isInWatchList }) => {
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
          <Image
            source={{ uri: movie.poster_url }}
            style={styles.modalImage}
          />
          <ScrollView style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{movie.title}</Text>
            
            <View style={styles.modalMetadata}>
              <Text style={styles.modalYear}>{movie.year}</Text>
              <Text style={styles.modalDot}>•</Text>
              <Text style={styles.modalRating}>★ {movie.rating}</Text>
              <Text style={styles.modalDot}>•</Text>
              <Text style={styles.modalDuration}>2h 30m</Text>
            </View>

            <Text style={styles.modalDescription}>
              {movie.description}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalPlayButton}>
                <Icon name="play" size={20} color="#000" />
                <Text style={styles.modalPlayButtonText}>Play</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalListButton,
                  isInWatchList && styles.modalListButtonActive
                ]}
                onPress={() => onAddToList(movie)}
                disabled={isInWatchList}
              >
                <Icon 
                  name={isInWatchList ? "checkmark" : "add"} 
                  size={24} 
                  color="#FFF" 
                />
                <Text style={styles.modalListButtonText}>
                  {isInWatchList ? 'Added' : 'My List'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
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
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/movies');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.featured) {
        setFeatured(data.featured);
      }
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
        
        // Collect all movies from all categories for discovery
        const movies = data.categories.flatMap(category => category.data);
        setAllMovies(movies);
      } else {
        setError('Invalid data format from API');
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MovieContext.Provider 
      value={{ 
        allMovies, 
        featured, 
        categories, 
        isLoading, 
        error, 
        fetchMovies 
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

// Replace the existing HomeScreen with this enhanced version
const HomeScreen = ({ navigation }) => {
  const { featured, categories, isLoading, error, fetchMovies } = useContext(MovieContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleMoviePress = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading movies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconFeather name="alert-circle" size={50} color="#E50914" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.homeContainer}>
      {/* Featured Content */}
      {featured && (
        <View style={styles.featuredContainer}>
          <MovieImage movie={featured} />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredDescription}>
              {featured.description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.playButton}>
                <Icon name="play" size={20} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.myListButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Icon name="list" size={20} color="#FFF" />
                <Text style={styles.myListButtonText}>My List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Categories */}
      {categories.map(category => (
        <View key={category.id} style={styles.moviesSection}>
          <Text style={styles.sectionTitle}>{category.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {category.data.map((movie) => (
              <TouchableOpacity 
                key={movie.id}
                onPress={() => handleMoviePress(movie)}
                style={styles.movieItem}
              >
                <MovieImage movie={movie} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
  
  const renderShow = ({ item }) => (
    <TouchableOpacity style={styles.showItem}>
      <View style={styles.showImageContainer}>
        <ImageWithFallback 
          path={item.image} 
          style={styles.showImage}
          fallbackStyle={styles.showImage}
        />
      </View>
      <Text style={styles.showTitle} numberOfLines={1}>{item.title}</Text>
      {item.year && <Text style={styles.showYear}>{item.year}</Text>}
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
          renderItem={renderShow}
          keyExtractor={(item, index) => `${item.id || index}`}
          numColumns={3}
          contentContainerStyle={styles.resultsList}
          columnWrapperStyle={styles.row}
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
    </View>
  );
};

// Create a context for the watch list
const WatchListContext = React.createContext();

// Create WatchListProvider
export const WatchListProvider = ({ children }) => {
  const [watchList, setWatchList] = useState([]);

  const addToWatchList = useCallback((movie) => {
    setWatchList(prev => [...prev, movie]);
  }, []);

  return (
    <WatchListContext.Provider value={{ watchList, addToWatchList }}>
      {children}
    </WatchListContext.Provider>
  );
};

// Update ProfileScreen
const ProfileScreen = ({ navigation }) => {
  const { watchList } = useContext(WatchListContext);
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
  
  const handleLogout = () => {
    logout();
    navigation.replace('Login');
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
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: userInfo.avatar }} 
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userInfo.email}</Text>
          <Text style={styles.profileEmail}>Gender: {userInfo.gender}</Text>
          <Text style={styles.profilePlan}>{userInfo.plan}</Text>
          <Text style={styles.profileDate}>Birthday: {userInfo.birthday}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="settings-outline" size={24} color="white" />
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help-circle-outline" size={24} color="white" />
          <Text style={styles.actionButtonText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={24} color="white" />
          <Text style={styles.actionButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Watch List */}
      <View style={styles.watchListContainer}>
        <Text style={styles.watchListTitle}>My Watch List</Text>
        {watchList.length === 0 ? (
          <View style={styles.emptyList}>
            <Icon name="film-outline" size={50} color="#666" />
            <Text style={styles.emptyListText}>
              Your watch list is empty.{'\n'}
              Swipe right on movies to add them here!
            </Text>
          </View>
        ) : (
          <View style={styles.watchList}>
            {watchList.map((movie, index) => (
              <View key={`${movie.id}-${index}`} style={styles.watchListItem}>
                <Image 
                  source={{ uri: movie.image }} 
                  style={styles.watchListItemImage}
                />
                <View style={styles.watchListItemInfo}>
                  <Text style={styles.watchListItemTitle}>{movie.title}</Text>
                  <Text style={styles.watchListItemYear}>{movie.year}</Text>
                </View>
                <TouchableOpacity style={styles.watchListItemPlay}>
                  <Icon name="play-circle" size={30} color="#E50914" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// Updated movie data with working image URLs
const SWIPE_MOVIES = [
  {
    id: '1',
    title: 'Stranger Things',
    image: 'https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
    year: '2016',
    rating: '8.7',
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.'
  },
  {
    id: '2',
    title: 'The Crown',
    image: 'https://m.media-amazon.com/images/M/MV5BZmY0MzBlNjctNTRmNy00Njk3LWFjMzctMWQwZDAwMGJmY2MyXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg',
    year: '2016',
    rating: '8.7',
    description: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign.'
  },
  {
    id: '3',
    title: 'Wednesday',
    image: 'https://m.media-amazon.com/images/M/MV5BM2ZmMjEyZmYtOGM4YS00YTNhLWE3ZDktYThhYjhkMmM2YzYyXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg',
    year: '2022',
    rating: '8.2',
    description: 'Follows Wednesday Addams years as a student at Nevermore Academy.'
  }
];

const DiscoverScreen = ({ navigation }) => {
  const { allMovies, isLoading, error, fetchMovies } = useContext(MovieContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToWatchList } = useContext(WatchListContext);
  const [discoverMovies, setDiscoverMovies] = useState([]);
  const [lastDirection, setLastDirection] = useState(null);
  
  // Refs for handling card movement
  const panResponderRef = useRef(null);
  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Load movies when component mounts
    if (allMovies && allMovies.length > 0) {
      // Shuffle and prepare movies
      const shuffled = [...allMovies].sort(() => Math.random() - 0.5);
      setDiscoverMovies(shuffled);
      console.log(`Loaded ${shuffled.length} movies for discover`);
    } else {
      // Fallback to sample movies
      setDiscoverMovies(SWIPE_MOVIES);
      console.log("Using fallback movies");
    }

    // Reset position when currentIndex changes
    resetPosition();
  }, [allMovies]);

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
      swiped('left');
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
      swiped('right');
      resetPosition();
    });
  };

  const swiped = (direction) => {
    console.log(`Swiped ${direction}`);
    setLastDirection(direction);
    
    // Add to watchlist if swiped right
    if (direction === 'right' && currentIndex < discoverMovies.length) {
      const movie = discoverMovies[currentIndex];
      console.log('Adding to watchlist:', movie.title);
      addToWatchList(movie);
    }
    
    // Move to next card
    setCurrentIndex(prevIndex => prevIndex + 1);
    
    // If we're near the end of our cards, load more
    if (currentIndex >= discoverMovies.length - 3 && allMovies.length > 0) {
      console.log("Near the end, loading more movies");
      const moreMovies = [...allMovies].sort(() => Math.random() - 0.5);
      setDiscoverMovies(prevMovies => [...prevMovies, ...moreMovies.slice(0, 10)]);
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
              <Text style={styles.cardDescription} numberOfLines={3}>
                {discoverMovies[currentIndex].description || 'No description available'}
              </Text>
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
            {lastDirection === 'right' ? 'Added to watchlist' : 'Skipped'}
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
    padding: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 40,
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
    justifyContent: 'space-between',
    marginVertical: 6,
    width: '100%',
  },
  showItem: {
    width: '29%',
    marginHorizontal: 2,
    marginVertical: 5,
    alignItems: 'center',
  },
  showImageContainer: {
    width: '100%',
    aspectRatio: 2/3,
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
  profileContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    color: '#999',
    marginBottom: 5,
  },
  profilePlan: {
    color: '#E50914',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileDate: {
    color: '#666',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginTop: 5,
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
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#181818',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalYear: {
    color: '#999',
  },
  modalDot: {
    color: '#999',
    marginHorizontal: 8,
  },
  modalRating: {
    color: '#FFF',
  },
  modalDuration: {
    color: '#999',
  },
  modalDescription: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  modalPlayButtonText: {
    color: '#000',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
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
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
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
});

export default App; 