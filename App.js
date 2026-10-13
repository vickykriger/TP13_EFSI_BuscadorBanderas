import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { GameProvider, useGame } from './src/context/GameContext';
import Flag from './src/components/Flag';
import GuessForm from './src/components/GuessForm';
import ScoreBoard from './src/components/ScoreBoard';

function Game() {
  const { loading, error } = useGame();

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

  return (
    <View>
      <ScoreBoard />
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
  errorText: { color: '#c0392b', fontSize: 16, textAlign: 'center' },
});