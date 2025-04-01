import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const ShowDetailsScreen = ({ route }) => {
  const { show } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: show.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{show.title}</Text>
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>2023</Text>
          <Text style={styles.metadataText}>TV-MA</Text>
          <Text style={styles.metadataText}>2h 30m</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </Text>
        <View style={styles.info}>
          <Text style={styles.infoLabel}>Cast:</Text>
          <Text style={styles.infoText}>Actor 1, Actor 2, Actor 3</Text>
          <Text style={styles.infoLabel}>Genre:</Text>
          <Text style={styles.infoText}>Drama, Thriller</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  metadataText: {
    color: 'gray',
    marginRight: 10,
  },
  playButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  description: {
    color: 'white',
    marginBottom: 20,
    lineHeight: 20,
  },
  info: {
    marginTop: 10,
  },
  infoLabel: {
    color: 'gray',
    marginBottom: 5,
  },
  infoText: {
    color: 'white',
    marginBottom: 15,
  },
});

export default ShowDetailsScreen; 