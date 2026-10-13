import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FLAGS_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images';
const CAPITALS_URL = 'https://countriesnow.space/api/v0.1/countries/capital';
const STORAGE_KEY = 'ranking_v2'; // { flags: [], capitals: [] }
const ROUND_TIME = 15;
const HINT_EVERY = 5;
const HINT_PENALTY = 2;
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

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const upsert = (list = [], name, score) => {
  const found = list.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const next = found
    ? list.map((p) => (p === found ? { ...p, score: Math.max(p.score, score) } : p))
    : [...list, { name, score }];
  return next.sort((a, b) => b.score - a.score);
};

const isLetter = (ch) => /[A-Za-zÀ-ÿ]/.test(ch);

const revealLetter = (name, revealed) => {
  const hidden = [];
  name.split('').forEach((ch, i) => {
    if (isLetter(ch) && !revealed.includes(i)) hidden.push(i);
  });
  if (hidden.length <= 1) return revealed;
  return [...revealed, hidden[Math.floor(Math.random() * hidden.length)]];
};

// Elimina una opción incorrecta al azar. Deja siempre al menos 2 opciones.
const dropOption = (options, removed, correct) => {
  const candidates = options.filter((o) => o !== correct && !removed.includes(o));
  if (candidates.length <= 1) return removed;
  return [...removed, candidates[Math.floor(Math.random() * candidates.length)]];
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [countries, setCountries] = useState([]); // cada uno con { name, flag, iso2, capital }
  const [currentCountry, setCurrentCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('flags'); // 'flags' | 'capitals'
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [status, setStatus] = useState('start');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [revealed, setRevealed] = useState([]); // modo banderas
  const [removed, setRemoved] = useState([]); // modo capitales
  const [playerName, setPlayerName] = useState('');
  const [ranking, setRanking] = useState({ flags: [], capitals: [] });

  // Al montar: banderas + capitales (cruzadas por iso2 / nombre)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(FLAGS_URL);
        const json = await res.json();
        if (json.error || !Array.isArray(json.data)) {
          throw new Error(json.msg || 'Respuesta inválida de la API');
        }

        const byIso = {};
        const byName = {};
        try {
          const capRes = await fetch(CAPITALS_URL);
          const capJson = await capRes.json();
          (capJson.data || []).forEach((c) => {
            if (!c.capital) return;
            byIso[c.iso2] = c.capital;
            byName[normalize(c.name)] = c.capital;
          });
        } catch (e) {
          // sin capitales: queda disponible solo el modo banderas
        }

        const merged = json.data.map((c) => ({
          ...c,
          capital: byIso[c.iso2] || byName[normalize(c.name)] || '',
        }));

        if (cancelled) return;
        setCountries(merged);
        setCurrentCountry(pickRandom(merged));
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
        if (raw) setRanking({ flags: [], capitals: [], ...JSON.parse(raw) });
      })
      .catch(() => {});
  }, []);

  const capitalsAvailable = useMemo(
    () => countries.some((c) => c.capital),
    [countries]
  );

  // En modo capitales solo entran países que tengan capital
  const pool = useMemo(
    () => (mode === 'capitals' ? countries.filter((c) => c.capital) : countries),
    [countries, mode]
  );

  // 3 opciones: la capital correcta + 2 incorrectas
  const options = useMemo(() => {
    if (mode !== 'capitals' || !currentCountry || !currentCountry.capital) return [];
    const others = shuffle(
      [...new Set(pool.map((c) => c.capital))].filter(
        (cap) => cap !== currentCountry.capital
      )
    ).slice(0, 2);
    return shuffle([currentCountry.capital, ...others]);
  }, [mode, currentCountry, pool]);

  const visibleOptions = options.filter((o) => !removed.includes(o));

  // Timer
  useEffect(() => {
    if (status !== 'playing' || !currentCountry || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, currentCountry, timeLeft]);

  // Pista automática cada 5s: letra (banderas) / quitar opción (capitales)
  useEffect(() => {
    if (status !== 'playing' || !currentCountry) return;
    const id = setInterval(() => {
      if (mode === 'flags') {
        setRevealed((prev) => revealLetter(currentCountry.name, prev));
      } else {
        setRemoved((prev) => dropOption(options, prev, currentCountry.capital));
      }
    }, HINT_EVERY * 1000);
    return () => clearInterval(id);
  }, [status, currentCountry, mode, options]);

  // Fin de la partida: guardar en el ranking del modo actual
  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    setStatus('over');
    const next = {
      ...ranking,
      [mode]: upsert(ranking[mode], playerName.trim(), score),
    };
    setRanking(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, [status, timeLeft, ranking, mode, playerName, score]);

  const resetRound = () => {
    setTimeLeft(ROUND_TIME);
    setRevealed([]);
    setRemoved([]);
  };

  const nextCountry = useCallback(() => {
    setCurrentCountry((prev) => pickRandom(pool, prev));
    resetRound();
  }, [pool]);

  const resetScore = useCallback(() => setScore(0), []);

  const startGame = useCallback(() => {
    if (!playerName.trim()) return;
    setScore(0);
    setLastResult(null);
    setCurrentCountry((prev) => pickRandom(pool, prev));
    resetRound();
    setStatus('playing');
  }, [pool, playerName]);

  const backToStart = useCallback(() => setStatus('start'), []);

  const requestHint = useCallback(() => {
    if (status !== 'playing' || !currentCountry) return;
    if (mode === 'flags') {
      const next = revealLetter(currentCountry.name, revealed);
      if (next === revealed) return;
      setRevealed(next);
    } else {
      const next = dropOption(options, removed, currentCountry.capital);
      if (next === removed) return;
      setRemoved(next);
    }
    setTimeLeft((t) => Math.max(0, t - HINT_PENALTY));
  }, [status, currentCountry, mode, revealed, removed, options]);

  // Sirve para ambos modos: compara contra el nombre o la capital
  const guess = useCallback(
    (text) => {
      if (status !== 'playing' || !currentCountry) return false;
      const target = mode === 'flags' ? currentCountry.name : currentCountry.capital;
      const isCorrect = normalize(text) === normalize(target);
      if (isCorrect) {
        const points = POINTS_HIT + timeLeft;
        setScore((s) => s + points);
        setLastResult({ type: 'correct', points });
        nextCountry();
      } else {
        setScore((s) => s + POINTS_MISS);
        setLastResult({ type: 'wrong', points: POINTS_MISS });
        if (mode === 'capitals') setRemoved((prev) => [...prev, text]);
      }
      return isCorrect;
    },
    [status, currentCountry, mode, timeLeft, nextCountry]
  );

  const maskedName =
    currentCountry && mode === 'flags'
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
    mode,
    capitalsAvailable,
    visibleOptions,
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
    setMode,
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