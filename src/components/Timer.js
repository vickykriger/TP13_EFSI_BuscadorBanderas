import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function Timer() {
  const { timeLeft, ROUND_TIME } = useGame();
  const danger = timeLeft <= 5;
  const progress = (timeLeft / ROUND_TIME) * 100;

  return (
    <View style={styles.container}>
      <Text style={[styles.time, danger && styles.danger]}>⏱ {timeLeft}s</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.bar,
            { width: `${progress}%`, backgroundColor: danger ? '#c0392b' : '#2563eb' },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 130 },
  time: { fontSize: 26, fontWeight: 'bold', color: '#111' },
  danger: { color: '#c0392b' },
  barBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  bar: { height: '100%' },
});