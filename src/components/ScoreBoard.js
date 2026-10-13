import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function ScoreBoard() {
  const { score, playerName } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{playerName.trim() || 'Jugador'}</Text>
      <Text style={styles.score}>⭐ {score} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  name: { fontSize: 14, color: '#666' },
  score: { fontSize: 26, fontWeight: 'bold', color: '#111' },
});