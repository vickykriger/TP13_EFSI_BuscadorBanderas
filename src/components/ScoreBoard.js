import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function ScoreBoard() {
  const { score } = useGame();
  return (
    <View style={styles.container}>
      <Text style={styles.score}>⭐ {score} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 8 },
  score: { fontSize: 26, fontWeight: 'bold', color: '#111' },
});