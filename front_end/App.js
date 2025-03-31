import React, { useState, useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ScrollView, Dimensions, Animated, PanResponder, Modal, Pressable, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import TinderCard from 'react-tinder-card';
import { getMovies } from './src/services/movieService';

// First, install the database driver
// For MySQL: npm install mysql2
// For PostgreSQL: npm install pg
// For SQL Server: npm install mssql

// Example structure (we'll fill in the actual details):
const dbConfig = {
  host: 'hackathon.c9g6wywk8mvf.eu-north-1.rds.amazonaws.com',
  port: '3306',
  database: 'hackathon',
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
  FROM movies_db
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
const ImageWithFallback = ({ source, style, ...props }) => {
  const [error, setError] = React.useState(false);

  return (
    <Image
      source={error ? { uri: 'https://via.placeholder.com/300x450?text=No+Image' } : source}
      onError={() => setError(true)}
      style={style}
      {...props}
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

const MovieImage = ({ movie }) => {
  const [imgSrc, setImgSrc] = useState(movie.image);

  const handleImageError = () => {
    if (imgSrc.includes('original')) {
      setImgSrc(imgSrc.replace('original', 'w500'));
    } else if (imgSrc.includes('w500')) {
      setImgSrc(imgSrc.replace('w500', 'w342'));
    } else if (imgSrc.includes('w342')) {
      setImgSrc(imgSrc.replace('w342', 'w185'));
    } else {
      setImgSrc(`https://placehold.co/400x600/1e1e1e/FFF?text=${encodeURIComponent(movie.title)}`);
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

// Replace the existing HomeScreen with this enhanced version
const HomeScreen = ({ navigation }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Use CATEGORIES as initial state
  const [categories, setCategories] = useState(CATEGORIES);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      console.log('Frontend: Starting API request');
      
      const response = await fetch('http://localhost:3001/api/movies');
      console.log('Frontend: Received response status:', response.status);
      
      const data = await response.json();
      console.log('Frontend: Received data:', JSON.stringify(data, null, 2));
      
      if (data.categories) {
        console.log('Frontend: Setting categories with length:', data.categories.length);
        setCategories(data.categories);
      } else {
        console.log('Frontend: No categories in response, using default CATEGORIES');
        setCategories(CATEGORIES);
      }
    } catch (err) {
      console.error('Frontend Error:', err);
      setError('Failed to fetch movies');
      console.log('Frontend: Using fallback CATEGORIES');
      setCategories(CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect debug
  useEffect(() => {
    console.log('Frontend: Component mounted');
    fetchMovies();
  }, []);

  // Add render debug
  console.log('Frontend: Rendering with categories:', categories?.length);

  const handleMoviePress = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.homeContainer}>
      {/* Featured Content */}
      <View style={styles.featuredContainer}>
        <MovieImage movie={FEATURED} />
        <View style={styles.featuredOverlay}>
          <Text style={styles.featuredTitle}>{FEATURED.title}</Text>
          <Text style={styles.featuredDescription}>
            {FEATURED.description}
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

      {/* Categories */}
      {categories.map(category => (
        <View key={category.id} style={styles.moviesSection}>
          <Text style={styles.sectionTitle}>{category.title}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.movieRow}
          >
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
        onAddToList={(movie) => {
          // Add to watch list logic here
          setModalVisible(false);
        }}
        isInWatchList={false}
      />
    </ScrollView>
  );
};

// Replace the simple SearchScreen with this new version
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredShows, setFilteredShows] = React.useState(SAMPLE_SHOWS);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = SAMPLE_SHOWS.filter(show =>
      show.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredShows(filtered);
  };

  const renderShow = ({ item }) => (
    <TouchableOpacity style={styles.showItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.showImage}
        resizeMode="cover"
      />
      <Text style={styles.showTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

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
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>
      
      {filteredShows.length > 0 ? (
        <FlatList
          data={filteredShows}
          renderItem={renderShow}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.resultsList}
        />
      ) : (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            No results found for "{searchQuery}"
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
const ProfileScreen = () => {
  const { watchList } = React.useContext(WatchListContext);

  const userInfo = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://i.pravatar.cc/150?img=8',
    plan: 'Premium',
    joinDate: 'Member since January 2024'
  };

  return (
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: userInfo.avatar }} 
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userInfo.name}</Text>
          <Text style={styles.profileEmail}>{userInfo.email}</Text>
          <Text style={styles.profilePlan}>{userInfo.plan}</Text>
          <Text style={styles.profileDate}>{userInfo.joinDate}</Text>
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
        <TouchableOpacity style={styles.actionButton}>
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

const DiscoverScreen = () => {
  const { addToWatchList } = React.useContext(WatchListContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 120) {
        swipeRight();
      } else if (gesture.dx < -120) {
        swipeLeft();
      } else {
        resetPosition();
      }
    }
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -500, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    const currentMovie = SWIPE_MOVIES[currentIndex];
    addToWatchList(currentMovie);
    Animated.timing(position, {
      toValue: { x: 500, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => nextCard());
  };

  const nextCard = () => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(prev => prev + 1);
  };

  const rotate = position.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ['-30deg', '0deg', '30deg']
  });

  const renderCard = () => {
    if (currentIndex >= SWIPE_MOVIES.length) {
      return (
        <View style={styles.card}>
          <Text style={styles.noMoreCards}>No more movies!</Text>
        </View>
      );
    }

    const movie = SWIPE_MOVIES[currentIndex];
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotate }
          ]
        }]}
      >
        <Image
          source={{ uri: movie.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{movie.title}</Text>
          <View style={styles.cardMetadata}>
            <Text style={styles.cardYear}>{movie.year}</Text>
            <Text style={styles.cardRating}>★ {movie.rating}</Text>
          </View>
          <Text style={styles.cardDescription}>{movie.description}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {renderCard()}
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.skipButton]}
          onPress={swipeLeft}
        >
          <Icon name="close" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.watchButton]}
          onPress={swipeRight}
        >
          <Icon name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('Main');
    }, 1500);
  };

  return (
    <View style={styles.loginContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>NETFLIX</Text>
      </View>

      <View style={styles.formContainer}>
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
          <TouchableOpacity>
            <Text style={styles.signupLink}>Sign up now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Update App component to include LoginScreen
const App = () => {
  return (
    <WatchListProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
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
    paddingVertical: 10,
  },
  showItem: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  showImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  showTitle: {
    color: 'white',
    marginTop: 5,
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#E50914',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App; 