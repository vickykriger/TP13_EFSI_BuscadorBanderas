import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images';
const ROUND_TIME = 15; // segundos por bandera
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

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('playing'); // 'playing' | 'over'
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);

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

  // Cuenta regresiva (se reinicia con cada bandera nueva)
  useEffect(() => {
    if (status !== 'playing' || !currentCountry || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, currentCountry, timeLeft]);

  // Se acabó el tiempo => fin de la partida
  useEffect(() => {
    if (status === 'playing' && timeLeft <= 0) setStatus('over');
  }, [status, timeLeft]);

  const nextCountry = useCallback(() => {
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setTimeLeft(ROUND_TIME);
  }, [countries]);

  const resetScore = useCallback(() => setScore(0), []);

  const startGame = useCallback(() => {
    setScore(0);
    setLastResult(null);
    setTimeLeft(ROUND_TIME);
    setCurrentCountry((prev) => pickRandom(countries, prev));
    setStatus('playing');
  }, [countries]);

  const guess = useCallback(
    (text) => {
      if (status !== 'playing' || !currentCountry) return false;
      const isCorrect = normalize(text) === normalize(currentCountry.name);
      if (isCorrect) {
        const points = POINTS_HIT + timeLeft; // bonus por los segundos que sobran
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
    guess,
    nextCountry,
    resetScore,
    startGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return ctx;
}