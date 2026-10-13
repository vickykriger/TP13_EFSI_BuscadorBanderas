import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images';
const STORAGE_KEY = 'ranking_v1';
const ROUND_TIME = 15;
const HINT_EVERY = 5; // segundos entre pistas automáticas
const HINT_PENALTY = 2; // segundos que resta pedir una pista
const POINTS_HIT = 10;
const POINTS_MISS = -1;

export const normalize = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const pickRandom = (list, exclude) => {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  let next;
  do {
    next = list[Math.floor(Math.random() * list.length)];
  } while (exclude && next.name === exclude.name);
  return next;
};

const upsert = (list, name, score) => {
  const found = list.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const next = found
    ? list.map((p) => (p === found ? { ...p, score: Math.max(p.score, score) } : p))
    : [...list, { name, score }];
  return next.sort((a, b) => b.score - a.score);
};

const isLetter = (ch) => /[A-Za-zÀ-ÿ]/.test(ch);

// Revela una letra al azar. Deja siempre al menos una oculta.
// Si no se puede revelar más, devuelve el mismo array.
const revealLetter = (name, revealed) => {
  const hidden = [];
  name.split('').forEach((ch, i) => {
    if (isLetter(ch) && !revealed.includes(i)) hidden.push(i);
  });
  if (hidden.length <= 1) return revealed;
  return [...revealed, hidden[Math.floor(Math.random() * hidden.length)]];
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('start');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [revealed, setRevealed] = useState([]); // índices de letras reveladas
  const [playerName, setPlayerName] = useState('');
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.error || !Array.isArray(json.data)) {
          throw new Error(json.msg || 'Respuesta inválida de la API');
        }
        if (cancelled) return;
        setCountries(json.data);
        setCurrentCountry(pickRandom(json.data));
      } catch (e) {
        if (!cancelled) setError(e.message || 'No se pudo cargar la lista');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRanking(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== 'playing' || !currentCountry || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, currentCountry, timeLeft]);

  // Pista automática cada HINT_EVERY segundos (sin costo)
  useEffect(() => {
    if (status !== 'playing' || !currentCountry) return;
    const id = setInterval(() => {
      setRevealed((prev) => revealLetter(currentCountry.name, prev));
    }, HINT_EVERY * 1000);
    return () => clearInterval(id);
  }, [status, currentCountry]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    setStatus('over');
    const next = upsert(ranking, playerName.trim(), score);
    setRanking(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, [status, timeLeft, ranking, playerName, score]);

  const nextCountry = useCallback(() => {
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setTimeLeft(ROUND_TIME);
    setRevealed([]);
  }, [countries]);

  const resetScore = useCallback(() => setScore(0), []);

  const startGame = useCallback(() => {
    if (!playerName.trim()) return;
    setScore(0);
    setLastResult(null);
    setTimeLeft(ROUND_TIME);
    setRevealed([]);
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setStatus('playing');
  }, [countries, playerName]);

  const backToStart = useCallback(() => setStatus('start'), []);

  // Pista pedida por el jugador: revela una letra y resta HINT_PENALTY segundos
  const requestHint = useCallback(() => {
    if (status !== 'playing' || !currentCountry) return;
    const next = revealLetter(currentCountry.name, revealed);
    if (next === revealed) return; // no quedan letras para revelar
    setRevealed(next);
    setTimeLeft((t) => Math.max(0, t - HINT_PENALTY));
  }, [status, currentCountry, revealed]);

  const guess = useCallback(
    (text) => {
      if (status !== 'playing' || !currentCountry) return false;
      const isCorrect = normalize(text) === normalize(currentCountry.name);
      if (isCorrect) {
        const points = POINTS_HIT + timeLeft;
        setScore((s) => s + points);
        setLastResult({ type: 'correct', points });
        nextCountry();
      } else {
        setScore((s) => s + POINTS_MISS);
        setLastResult({ type: 'wrong', points: POINTS_MISS });
      }
      return isCorrect;
    },
    [status, currentCountry, timeLeft, nextCountry]
  );

  // Nombre enmascarado: "_ r _ e n _ i n _"
  const maskedName = currentCountry
    ? currentCountry.name
        .split('')
        .map((ch, i) =>
          ch === ' ' ? '/' : isLetter(ch) && !revealed.includes(i) ? '_' : ch
        )
        .join(' ')
    : '';

  const value = {
    countries,
    currentCountry,
    loading,
    error,
    score,
    lastResult,
    status,
    timeLeft,
    ROUND_TIME,
    HINT_EVERY,
    HINT_PENALTY,
    maskedName,
    playerName,
    ranking,
    setPlayerName,
    guess,
    nextCountry,
    resetScore,
    startGame,
    backToStart,
    requestHint,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return ctx;
}