import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { GameProvider, useGame } from './src/context/GameContext';
import Flag from './src/components/Flag';
import GuessForm from './src/components/GuessForm';
import ScoreBoard from './src/components/ScoreBoard';
import Timer from './src/components/Timer';

function Game() {
  const { loading, error, status, score, startGame } = useGame();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12 }}>Cargando países...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </View>
    );
  }

  if (status === 'over') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>⏰ ¡Se acabó el tiempo!</Text>
        <Text style={styles.finalScore}>Puntaje final: {score}</Text>
        <TouchableOpacity style={styles.playButton} onPress={startGame}>
          <Text style={styles.playText}>Jugar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.topBar}>
        <ScoreBoard />
        <Timer />
      </View>
      <Flag />
      <GuessForm />
    </View>
  );
}

export default function App() {
  return (
    <GameProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Game />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: 30 },
  scroll: { flexGrow: 1, padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  finalScore: { fontSize: 22, marginVertical: 12 },
  playButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 16,
  },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#c0392b', fontSize: 16, textAlign: 'center' },
});