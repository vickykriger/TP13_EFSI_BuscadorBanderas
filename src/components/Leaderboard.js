import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function Leaderboard() {
  const { players } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Tabla de jugadores</Text>

      {players.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay partidas jugadas</Text>
      ) : (
        players.map((p, i) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.pos}>{i + 1}</Text>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.score}>{p.score}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888' },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  pos: { width: 30, fontWeight: 'bold' },
  name: { flex: 1 },
  score: { fontWeight: 'bold' },
});