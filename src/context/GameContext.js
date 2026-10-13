import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images';
const GAME_DURATION = 60; // segundos
const POINTS_HIT = 10;
const POINTS_MISS = -1;
const HINT_COST = 2;

// Normaliza texto: minúsculas, sin tildes, sin espacios extra
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

const GameContext = createContext(null);

export function GameProvider({ children }) {
  // --- Datos de la API ---
  const [countries, setCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Juego ---
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('start'); // 'start' | 'playing' | 'over'
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hintLevel, setHintLevel] = useState(0); // 0, 1 o 2
  const [lastResult, setLastResult] = useState(null); // 'correct' | 'wrong' | null

  // --- Jugadores ---
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]); // [{ id, name, score }]

  // 1) Al montar: traer países y elegir uno al azar
  useEffect(() => {
    let cancelled = false;

    const fetchCountries = async () => {
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
        if (!cancelled) setError(e.message || 'No se pudo cargar la lista de países');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Cuenta regresiva
  useEffect(() => {
    if (status !== 'playing' || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, timeLeft]);

  // 3) Fin del juego cuando llega a 0: guarda al jugador en el leaderboard
  useEffect(() => {
    if (status === 'playing' && timeLeft <= 0) {
      setStatus('over');
      setPlayers((prev) =>
        [
          ...prev,
          {
            id: Date.now().toString(),
            name: playerName.trim() || 'Anónimo',
            score,
          },
        ]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
      );
    }
  }, [status, timeLeft, score, playerName]);

  // --- Funciones expuestas ---
  const nextCountry = useCallback(() => {
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setHintLevel(0);
  }, [countries]);

  const resetScore = useCallback(() => setScore(0), []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setLastResult(null);
    setHintLevel(0);
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setStatus('playing');
  }, [countries]);

  const backToStart = useCallback(() => setStatus('start'), []);

  // Devuelve true si acertó
  const guess = useCallback(
    (text) => {
      if (status !== 'playing' || !currentCountry) return false;
      const isCorrect = normalize(text) === normalize(currentCountry.name);

      if (isCorrect) {
        setScore((s) => s + POINTS_HIT);
        setLastResult('correct');
        nextCountry();
      } else {
        setScore((s) => s + POINTS_MISS);
        setLastResult('wrong');
      }
      return isCorrect;
    },
    [status, currentCountry, nextCountry]
  );

  const useHint = useCallback(() => {
    if (status !== 'playing' || hintLevel >= 2) return;
    setHintLevel((h) => h + 1);
    setScore((s) => s - HINT_COST);
  }, [status, hintLevel]);

  // Texto de pista según el nivel
  let hintText = '';
  if (currentCountry && hintLevel >= 1) {
    hintText = `Empieza con "${currentCountry.name[0].toUpperCase()}"`;
  }
  if (currentCountry && hintLevel >= 2) {
    hintText += ` · ${currentCountry.name.length} letras`;
  }

  const value = {
    // estado
    countries,
    currentCountry,
    loading,
    error,
    score,
    status,
    timeLeft,
    hintLevel,
    hintText,
    lastResult,
    playerName,
    players,
    // constantes útiles
    GAME_DURATION,
    HINT_COST,
    // acciones
    setPlayerName,
    guess,
    nextCountry,
    resetScore,
    startGame,
    backToStart,
    useHint,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return ctx;
}