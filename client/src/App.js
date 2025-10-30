import React, { useEffect, useMemo, useState } from "react";
import { fetchConfig, fetchScores, postAction } from "./api";
import ScoreTable from "./components/ScoreTable";

export default function App() {
  const [people, setPeople] = useState([]);
  const [games, setGames] = useState([]);
  const [totals, setTotals] = useState({}); // key: `${person}|${game}` -> number
  const [pending, setPending] = useState({}); // key -> boolean
  const [errors, setErrors] = useState({}); // key -> string (inline error)

  // Helper to key a cell
  const cellKey = (person, gameKey) => `${person}|${gameKey}`;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cfg = await fetchConfig();
        if (!isMounted) return;
        setPeople(cfg.people || []);
        setGames(cfg.games || []);
        const scores = await fetchScores();
        if (!isMounted) return;
        const byCell = {};
        (scores.scores || []).forEach((s) => {
          byCell[cellKey(s.person, s.game)] = s.total;
        });
        // Ensure zeros for missing pairs (defensive)
        for (const person of cfg.people || []) {
          for (const g of cfg.games || []) {
            const k = cellKey(person, g.key);
            if (!(k in byCell)) byCell[k] = 0;
          }
        }
        setTotals(byCell);
      } catch (e) {
        // Simple global fallback; cells will show blanks if this fails
        console.error(e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const setCellPending = (k, v) => setPending((p) => ({ ...p, [k]: v }));
  const setCellError = (k, msg) =>
    setErrors((e) => ({ ...e, [k]: msg || "" }));

  // Optimistic update handler
  const runAction = async (payload, optimisticDelta) => {
    const k = cellKey(payload.person, payload.game);
    if (pending[k]) return; // serialize per cell
    setCellError(k, "");
    setCellPending(k, true);

    const prev = totals[k] ?? 0;
    // Optimistic bump
    setTotals((t) => ({ ...t, [k]: prev + optimisticDelta }));

    try {
      const res = await postAction(payload);
      // Server-confirm total wins over our optimistic value
      setTotals((t) => ({ ...t, [k]: res.total }));
    } catch (e) {
      // Revert on error
      setTotals((t) => ({ ...t, [k]: prev }));
      setCellError(k, e.message || "Try again");
    } finally {
      setCellPending(k, false);
    }
  };

  const api = useMemo(() => ({ runAction, totals, pending, errors }), [totals, pending, errors]);

  return (
    <div className="container">
      <h1>Scoreboard</h1>
      <ScoreTable people={people} games={games} api={api} />
      <footer>
        <small>All changes persist to SQLite. Inline controls are keyboard accessible.</small>
      </footer>
    </div>
  );
}