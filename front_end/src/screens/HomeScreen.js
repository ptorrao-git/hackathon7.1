import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  const categories = [
    { id: 1, title: 'Trending Now' },
    { id: 2, title: 'Popular on Netflix' },
    { id: 3, title: 'My List' },
  ];

  const shows = [
    { id: 1, title: 'Show 1', image: 'https://via.placeholder.com/300x450' },
    { id: 2, title: 'Show 2', image: 'https://via.placeholder.com/300x450' },
    { id: 3, title: 'Show 3', image: 'https://via.placeholder.com/300x450' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.featuredContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/600x900' }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredButtons}>
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.myListButton}>
            <Text style={styles.myListButtonText}>My List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {categories.map(category => (
        <View key={category.id} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shows.map(show => (
              <TouchableOpacity
                key={show.id}
                onPress={() => navigation.navigate('ShowDetails', { show })}
              >
                <Image source={{ uri: show.image }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  featuredContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.7,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  playButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  playButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  myListButton: {
    backgroundColor: 'gray',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  myListButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginVertical: 10,
    paddingLeft: 10,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  thumbnail: {
    width: 120,
    height: 180,
    marginRight: 10,
    borderRadius: 5,
  },
});

export default HomeScreen; 