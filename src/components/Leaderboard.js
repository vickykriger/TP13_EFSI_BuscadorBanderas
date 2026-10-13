import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function Leaderboard() {
  const { ranking, playerName } = useGame();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Tabla de posiciones</Text>

      {ranking.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay partidas jugadas</Text>
      ) : (
        ranking.map((p, i) => {
          const me = p.name.toLowerCase() === playerName.trim().toLowerCase();
          return (
            <View key={p.name} style={[styles.row, me && styles.me]}>
              <Text style={styles.pos}>{i + 1}</Text>
              <Text style={[styles.name, me && styles.bold]}>{p.name}</Text>
              <Text style={styles.bold}>{p.score}</Text>
            </View>
          );
        })
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
  me: { backgroundColor: '#eff6ff' },
  pos: { width: 30, fontWeight: 'bold' },
  name: { flex: 1 },
  bold: { fontWeight: 'bold' },
});