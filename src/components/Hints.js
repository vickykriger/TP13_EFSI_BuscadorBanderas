import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';

export default function Hints() {
  const { mode, maskedName, requestHint, HINT_EVERY, HINT_PENALTY } = useGame();

  return (
    <View style={styles.container}>
      {mode === 'flags' ? (
        <>
          <Text style={styles.mask}>{maskedName}</Text>
          <Text style={styles.info}>Cada {HINT_EVERY}s se revela una letra</Text>
        </>
      ) : (
        <Text style={styles.info}>Cada {HINT_EVERY}s se elimina una opción</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={requestHint}>
        <Text style={styles.buttonText}>💡 Pedir pista (−{HINT_PENALTY}s)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 14, paddingHorizontal: 20 },
  mask: { fontSize: 22, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  info: { fontSize: 12, color: '#777', marginTop: 4 },
  button: {
    marginTop: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});