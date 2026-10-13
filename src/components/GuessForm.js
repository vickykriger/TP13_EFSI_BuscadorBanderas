import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame, normalize } from '../context/GameContext';

export default function GuessForm() {
  const { countries, guess, lastResult } = useGame();
  const [text, setText] = useState('');

  const suggestions = useMemo(() => {
    const q = normalize(text);
    if (!q) return [];
    return countries.filter((c) => normalize(c.name).includes(q)).slice(0, 5);
  }, [text, countries]);

  const submit = (value) => {
    const answer = value ?? text;
    if (!answer.trim()) return;
    guess(answer);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="¿De qué país es esta bandera?"
        value={text}
        onChangeText={setText}
        autoCapitalize="words"
        autoCorrect={false}
        onSubmitEditing={() => submit()}
        returnKeyType="send"
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={styles.suggestion}
              onPress={() => submit(c.name)}
            >
              <Text style={styles.suggestionText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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

      <TouchableOpacity style={styles.button} onPress={() => submit()}>
        <Text style={styles.buttonText}>Adivinar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  suggestions: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  suggestionText: { fontSize: 15 },
  feedback: { textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  button: {
    marginTop: 14,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});