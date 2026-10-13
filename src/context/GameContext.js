import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images';
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
  const [lastResult, setLastResult] = useState(null); // { type, points }

  // Al montar: traer países y elegir uno al azar
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

  const nextCountry = useCallback(() => {
    setCurrentCountry((prev) => pickRandom(countries, prev));
  }, [countries]);

  const resetScore = useCallback(() => setScore(0), []);

  const guess = useCallback(
    (text) => {
      if (!currentCountry) return false;
      const isCorrect = normalize(text) === normalize(currentCountry.name);
      if (isCorrect) {
        setScore((s) => s + POINTS_HIT);
        setLastResult({ type: 'correct', points: POINTS_HIT });
        nextCountry();
      } else {
        setScore((s) => s + POINTS_MISS);
        setLastResult({ type: 'wrong', points: POINTS_MISS });
      }
      return isCorrect;
    },
    [currentCountry, nextCountry]
  );

  const value = {
    countries,
    currentCountry,
    loading,
    error,
    score,
    lastResult,
    guess,
    nextCountry,
    resetScore,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return ctx;
}