import React, { useMemo, useRef, useEffect, useState } from "react";
import RingTossCell from "./CellControls/RingTossCell";
import SimpleWinCell from "./CellControls/SimpleWinCell";
import JeopardyCell from "./CellControls/JeopardyCell";
import Toast from "./Toast";

export default function ScoreTable({ people, games, api }) {
  const gameOrderKeys = useMemo(() => games.map((g) => g.key), [games]);

  // Compute per-person totals from current cell totals
  const totalsByPerson = useMemo(() => {
    const out = {};
    for (const person of people) {
      let sum = 0;
      for (const gk of gameOrderKeys) {
        const k = `${person}|${gk}`;
        const v = api.totals[k] ?? 0;
        sum += Number.isFinite(v) ? v : 0;
      }
      out[person] = sum;
    }
    return out;
  }, [people, gameOrderKeys, api.totals]);

  // Sort people by total desc, then name asc
  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const tb = (totalsByPerson[b] ?? 0) - (totalsByPerson[a] ?? 0);
      if (tb !== 0) return tb;
      return a.localeCompare(b);
    });
  }, [people, totalsByPerson]);

    const [toast, setToast] = useState(false);
    const prevOrderRef = useRef("");
    const isFirstPaintRef = useRef(true);

    // 1) Detect a change in leaderboard order and show toast
    useEffect(() => {
      const orderStr = sortedPeople.join("|");
      if (isFirstPaintRef.current) {
        prevOrderRef.current = orderStr;
        isFirstPaintRef.current = false;
        return;
      }
      if (orderStr !== prevOrderRef.current) {
        setToast(true);                  // turn toast on
        prevOrderRef.current = orderStr; // remember current order
      }
    }, [sortedPeople]);

    // 2) Auto-hide toast after ~2s whenever it's shown
    useEffect(() => {
      if (!toast) return;
      const id = setTimeout(() => setToast(false), 2000);
      return () => clearTimeout(id);     // cleanup on unmount or if toast toggles again
    }, [toast]);

  const personTotal = (person) => totalsByPerson[person] ?? 0;

  return (
    <>
      <div className="table-wrap">
        <table className="score-table">
          <thead>
            <tr>
              <th>Name</th>
              {games.map((g) => (
                <th key={g.key}>{g.label}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedPeople.map((person) => (
              <tr key={person}>
                <td className="name-cell">{person}</td>
                {gameOrderKeys.map((gk) => (
                  <td key={`${person}-${gk}`} className="cell">
                    <Cell person={person} gameKey={gk} api={api} />
                  </td>
                ))}
                <td className="cell total-cell">
                  <strong aria-live="polite">{personTotal(person)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast message="Scoreboard is shifted" show={toast} />
    </>
  );
}

function Cell({ person, gameKey, api }) {
  if (gameKey === "ring_toss" || gameKey === "eye_toss") {
    // Both use the same dropdown-based component
    return <RingTossCell person={person} gameKey={gameKey} api={api} />;
  }
  if (gameKey === "jeopardy") {
    return <JeopardyCell person={person} gameKey={gameKey} api={api} />;
  }
  return <SimpleWinCell person={person} gameKey={gameKey} api={api} />;
}