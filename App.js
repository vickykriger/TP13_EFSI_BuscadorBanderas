import React from 'react';
import Hints from './src/components/Hints';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
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
import Leaderboard from './src/components/Leaderboard';

function StartScreen() {
  const { playerName, setPlayerName, startGame } = useGame();
  const canPlay = playerName.trim().length > 0;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>🌍 Buscador de Banderas</Text>
      <Text style={styles.subtitle}>
        Tenés 15 segundos por bandera. Si acertás, los segundos que sobran suman puntos.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        value={playerName}
        onChangeText={setPlayerName}
        maxLength={20}
      />

      <TouchableOpacity
        style={[styles.playButton, !canPlay && styles.disabled]}
        onPress={startGame}
        disabled={!canPlay}
      >
        <Text style={styles.playText}>Jugar</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 24, width: '100%' }}>
        <Leaderboard />
      </View>
    </View>
  );
}

function PlayingScreen() {
  return (
    <View>
      <View style={styles.topBar}>
        <ScoreBoard />
        <Timer />
      </View>
      <Flag />
      <Hints />
      <GuessForm />
    </View>
  );
}

function GameOverScreen() {
  const { score, startGame, backToStart } = useGame();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>⏰ ¡Se acabó el tiempo!</Text>
      <Text style={styles.finalScore}>Puntaje final: {score}</Text>

      <TouchableOpacity style={styles.playButton} onPress={startGame}>
        <Text style={styles.playText}>Jugar de nuevo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={backToStart}>
        <Text style={styles.linkText}>Cambiar de jugador</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20, width: '100%' }}>
        <Leaderboard />
      </View>
    </View>
  );
}

function Game() {
  const { loading, error, status } = useGame();

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

  if (status === 'start') return <StartScreen />;
  if (status === 'over') return <GameOverScreen />;
  return <PlayingScreen />;
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
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  playButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 16,
  },
  disabled: { opacity: 0.4 },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 12, padding: 8 },
  linkText: { color: '#2563eb', fontSize: 15 },
  finalScore: { fontSize: 22, marginVertical: 12 },
  errorText: { color: '#c0392b', fontSize: 16, textAlign: 'center' },
});