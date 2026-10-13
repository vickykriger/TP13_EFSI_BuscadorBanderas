import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function CapitalOptions() {
  const { visibleOptions, guess, lastResult } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.question}>¿Cuál es la capital de este país?</Text>

      {visibleOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.option}
          onPress={() => guess(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      {lastResult && (
        <Text
          style={[
            styles.feedback,
            { color: lastResult.type === 'correct' ? '#1b8a3a' : '#c0392b' },
          ]}
        >
          {lastResult.type === 'correct' ? '¡Correcto!' : 'Incorrecto'}{' '}
          {lastResult.points > 0 ? '+' : ''}
          {lastResult.points}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 20 },
  question: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  option: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  optionText: { fontSize: 17, color: '#2563eb', fontWeight: '600' },
  feedback: { textAlign: 'center', marginTop: 6, fontWeight: 'bold', fontSize: 16 },
});