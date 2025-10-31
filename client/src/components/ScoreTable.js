// import React, { useMemo, useRef, useEffect, useState } from "react";
// import RingTossCell from "./CellControls/RingTossCell";
// import SimpleWinCell from "./CellControls/SimpleWinCell";
// import JeopardyCell from "./CellControls/JeopardyCell";
// import Toast from "./Toast";

// export default function ScoreTable({ people, games, api }) {
//   const gameOrderKeys = useMemo(() => games.map((g) => g.key), [games]);

//   // Compute per-person totals from current cell totals
//   const totalsByPerson = useMemo(() => {
//     const out = {};
//     for (const person of people) {
//       let sum = 0;
//       for (const gk of gameOrderKeys) {
//         const k = `${person}|${gk}`;
//         const v = api.totals[k] ?? 0;
//         sum += Number.isFinite(v) ? v : 0;
//       }
//       out[person] = sum;
//     }
//     return out;
//   }, [people, gameOrderKeys, api.totals]);

//   // Sort people by total desc, then name asc
//   const sortedPeople = useMemo(() => {
//     return [...people].sort((a, b) => {
//       const tb = (totalsByPerson[b] ?? 0) - (totalsByPerson[a] ?? 0);
//       if (tb !== 0) return tb;
//       return a.localeCompare(b);
//     });
//   }, [people, totalsByPerson]);

//     const [toast, setToast] = useState(false);
//     const prevOrderRef = useRef("");
//     const isFirstPaintRef = useRef(true);

//     // 1) Detect a change in leaderboard order and show toast
//     useEffect(() => {
//       const orderStr = sortedPeople.join("|");
//       if (isFirstPaintRef.current) {
//         prevOrderRef.current = orderStr;
//         isFirstPaintRef.current = false;
//         return;
//       }
//       if (orderStr !== prevOrderRef.current) {
//         setToast(true);                  // turn toast on
//         prevOrderRef.current = orderStr; // remember current order
//       }
//     }, [sortedPeople]);

//     // 2) Auto-hide toast after ~2s whenever it's shown
//     useEffect(() => {
//       if (!toast) return;
//       const id = setTimeout(() => setToast(false), 2000);
//       return () => clearTimeout(id);     // cleanup on unmount or if toast toggles again
//     }, [toast]);

//   const personTotal = (person) => totalsByPerson[person] ?? 0;

//   return (
//     <>
//       <div className="table-wrap">
//         <table className="score-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               {games.map((g) => (
//                 <th key={g.key}>{g.label}</th>
//               ))}
//               <th>Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {sortedPeople.map((person) => (
//               <tr key={person}>
//                 <td className="name-cell">{person}</td>
//                 {gameOrderKeys.map((gk) => (
//                   <td key={`${person}-${gk}`} className="cell">
//                     <Cell person={person} gameKey={gk} api={api} />
//                   </td>
//                 ))}
//                 <td className="cell total-cell">
//                   <strong aria-live="polite">{personTotal(person)}</strong>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <Toast message="Scoreboard is shifted" show={toast} />
//     </>
//   );
// }

// function Cell({ person, gameKey, api }) {
//   if (gameKey === "ring_toss" || gameKey === "eye_toss") {
//     // Both use the same dropdown-based component
//     return <RingTossCell person={person} gameKey={gameKey} api={api} />;
//   }
//   if (gameKey === "jeopardy") {
//     return <JeopardyCell person={person} gameKey={gameKey} api={api} />;
//   }
//   return <SimpleWinCell person={person} gameKey={gameKey} api={api} />;
// }
import React, { useMemo, useRef, useEffect, useState } from "react";
import RingTossCell from "./CellControls/RingTossCell";
import SimpleWinCell from "./CellControls/SimpleWinCell";
import JeopardyCell from "./CellControls/JeopardyCell";
import Toast from "./Toast";
import EyeTossCell from "./CellControls/EyeTossCell";

export default function ScoreTable({ people, games, api }) {
  const gameOrderKeys = useMemo(() => games.map((g) => g.key), [games]);

  // local bonus layer (superpowers add here)
  const [bonusByPerson, setBonusByPerson] = useState({});
  // per-person capped uses (for superpowers)
  const [superUses, setSuperUses] = useState({});

  // Compute per-person totals from current cell totals + bonus
  const totalsByPerson = useMemo(() => {
    const out = {};
    for (const person of people) {
      let sum = 0;
      for (const gk of gameOrderKeys) {
        const k = `${person}|${gk}`;
        const v = api.totals[k] ?? 0;
        sum += Number.isFinite(v) ? v : 0;
      }
      sum += bonusByPerson[person] ?? 0;
      out[person] = sum;
    }
    return out;
  }, [people, gameOrderKeys, api.totals, bonusByPerson]);

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
      setToast(true);
      prevOrderRef.current = orderStr;
    }
  }, [sortedPeople]);

  // 2) Auto-hide toast after ~2s
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const personTotal = (person) => totalsByPerson[person] ?? 0;

  // helper for superpowers
  const addBonus = (person, delta) => {
    setBonusByPerson((prev) => ({
      ...prev,
      [person]: (prev[person] ?? 0) + delta,
    }));
  };
  const incSuperUse = (person) => {
    setSuperUses((prev) => ({
      ...prev,
      [person]: (prev[person] ?? 0) + 1,
    }));
  };
  const superUsedOut = (person, cap = 3) => (superUses[person] ?? 0) >= cap;

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
              <th>Superpower</th>
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
                <td className="cell">
                  <SuperpowerCell
                    person={person}
                    allPeople={people}
                    addBonus={addBonus}
                    superUsedOut={superUsedOut}
                    incSuperUse={incSuperUse}
                  />
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
  if (gameKey === "ring_toss") {
    return <RingTossCell person={person} gameKey={gameKey} api={api} />;
  }
  if (gameKey === "eye_toss") {
    return <EyeTossCell person={person} gameKey={gameKey} api={api} />;
  }
  if (gameKey === "jeopardy") {
    return <JeopardyCell person={person} gameKey={gameKey} api={api} />;
  }
  return <SimpleWinCell person={person} gameKey={gameKey} api={api} />;
}

function SuperpowerCell({
  person,
  allPeople,
  addBonus,
  superUsedOut,
  incSuperUse,
}) {
  // per-cell UI state
  const [arjunTarget, setArjunTarget] = useState(
    allPeople.find((p) => p !== "Arjun") || ""
  );
  const [jigarTarget, setJigarTarget] = useState(allPeople[0] || "");
  const [saanchiTarget, setSaanchiTarget] = useState(allPeople[0] || "");
  const [saanchiMode, setSaanchiMode] = useState("give");
  const [anantVal, setAnantVal] = useState("50");
  const [bhavyaTarget, setBhavyaTarget] = useState(allPeople[0] || "");
  const [saniaVal, setSaniaVal] = useState("100");
  const [akshitaLevel, setAkshitaLevel] = useState("1");
  const [chiragTarget, setChiragTarget] = useState(allPeople[0] || "");

  const disabled3 = superUsedOut(person, 3);

  // mimic logic for Arjun
  const applyMimicEffect = (targetName) => {
    switch (targetName) {
      case "Mayukha":
        addBonus("Arjun", 100);
        break;
      case "Jigar":
        addBonus("Arjun", 100);
        break;
      case "Saanchi":
        addBonus("Arjun", 100);
        break;
      case "Anant":
        addBonus("Arjun", 100);
        break;
      case "Bhavya":
        addBonus("Arjun", -100);
        break;
      case "Sania":
        addBonus("Arjun", 100);
        break;
      case "Sohum":
        addBonus("Arjun", 10);
        break;
      case "Ishaan":
        addBonus("Arjun", 100);
        break;
      case "Kabir":
        addBonus("Arjun", 50);
        break;
      case "Akshita":
        addBonus("Arjun", 100);
        break;
      case "Aadit":
        addBonus("Arjun", 10);
        break;
      case "Chirag":
        addBonus("Arjun", -100);
        break;
      case "Nandini":
        addBonus("Arjun", 50);
        break;
      default:
        break;
    }
  };

  // render per-person
  switch (person) {
    case "Mayukha":
      return (
        <button
          onClick={() => {
            if (disabled3) return;
            addBonus("Mayukha", 100);
            incSuperUse("Mayukha");
          }}
          disabled={disabled3}
        >
          Activate Superpower
        </button>
      );

    case "Arjun":
      return (
        <div className="super-row">
          <select
            value={arjunTarget}
            onChange={(e) => setArjunTarget(e.target.value)}
            disabled={disabled3}
          >
            {allPeople
              .filter((p) => p !== "Arjun")
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              applyMimicEffect(arjunTarget);
              incSuperUse("Arjun");
            }}
            disabled={disabled3}
          >
            Mimic
          </button>
        </div>
      );

    case "Jigar":
      return (
        <div className="super-row">
          <select
            value={jigarTarget}
            onChange={(e) => setJigarTarget(e.target.value)}
            disabled={disabled3}
          >
            {allPeople.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              addBonus("Jigar", 100);
              addBonus(jigarTarget, -100);
              incSuperUse("Jigar");
            }}
            disabled={disabled3}
          >
            OK
          </button>
        </div>
      );

    case "Saanchi":
      return (
        <div className="super-row">
          <select
            value={saanchiTarget}
            onChange={(e) => setSaanchiTarget(e.target.value)}
            disabled={disabled3}
          >
            {allPeople.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={saanchiMode}
            onChange={(e) => setSaanchiMode(e.target.value)}
            disabled={disabled3}
          >
            <option value="give">Give 100</option>
            <option value="take">Remove 100</option>
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              if (saanchiMode === "give") {
                addBonus(saanchiTarget, 100);
              } else {
                addBonus(saanchiTarget, -100);
              }
              incSuperUse("Saanchi");
            }}
            disabled={disabled3}
          >
            OK
          </button>
        </div>
      );

    case "Anant":
      return (
        <div className="super-row">
          <input
            type="number"
            value={anantVal}
            onChange={(e) => setAnantVal(e.target.value)}
            disabled={disabled3}
            style={{ width: "4.5rem" }}
          />
          <button
            onClick={() => {
              if (disabled3) return;
              const x = Number(anantVal) || 0;
              addBonus("Anant", 2 * x);
              incSuperUse("Anant");
            }}
            disabled={disabled3}
          >
            Apply
          </button>
        </div>
      );

    case "Bhavya":
      return (
        <div className="super-row">
          <select
            value={bhavyaTarget}
            onChange={(e) => setBhavyaTarget(e.target.value)}
            disabled={disabled3}
          >
            {allPeople.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              addBonus(bhavyaTarget, -100);
              incSuperUse("Bhavya");
            }}
            disabled={disabled3}
          >
            Curse
          </button>
        </div>
      );

    case "Sania":
      return (
        <div className="super-row">
          <input
            type="number"
            value={saniaVal}
            onChange={(e) => setSaniaVal(e.target.value)}
            disabled={disabled3}
            style={{ width: "4.5rem" }}
          />
          <button
            onClick={() => {
              if (disabled3) return;
              const amt = Number(saniaVal) || 0;
              addBonus("Sania", amt);
              incSuperUse("Sania");
            }}
            disabled={disabled3}
          >
            Claim
          </button>
        </div>
      );

    case "Sohum":
      return (
        <button
          onClick={() => {
            addBonus("Sohum", 10);
          }}
        >
          Activate
        </button>
      );

    case "Ishaan":
      return (
        <button
          onClick={() => {
            if (disabled3) return;
            addBonus("Ishaan", 100);
            incSuperUse("Ishaan");
          }}
          disabled={disabled3}
        >
          Activate Superpower
        </button>
      );

    case "Kabir":
      return (
        <button
          onClick={() => {
            if (disabled3) return;
            addBonus("Kabir", 50);
            incSuperUse("Kabir");
          }}
          disabled={disabled3}
        >
          Activate
        </button>
      );

    case "Akshita":
      return (
        <div className="super-row">
          <select
            value={akshitaLevel}
            onChange={(e) => setAkshitaLevel(e.target.value)}
            disabled={disabled3}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              const lvl = Number(akshitaLevel);
              const map = {
                1: 50,
                2: 75,
                3: 100,
                4: 125,
                5: 150,
                6: 175,
              };
              addBonus("Akshita", map[lvl] ?? 0);
              incSuperUse("Akshita");
            }}
            disabled={disabled3}
          >
            Apply
          </button>
        </div>
      );

    case "Aadit":
      return (
        <button
          onClick={() => {
            addBonus("Aadit", 10);
          }}
        >
          Activate
        </button>
      );

    case "Chirag":
      return (
        <div className="super-row">
          <select
            value={chiragTarget}
            onChange={(e) => setChiragTarget(e.target.value)}
            disabled={disabled3}
          >
            {allPeople.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (disabled3) return;
              addBonus(chiragTarget, -100);
              incSuperUse("Chirag");
            }}
            disabled={disabled3}
          >
            Slash
          </button>
        </div>
      );

    case "Nandini":
      return (
        <button
          onClick={() => {
            if (disabled3) return;
            addBonus("Nandini", 50);
            incSuperUse("Nandini");
          }}
          disabled={disabled3}
        >
          Activate
        </button>
      );

    default:
      return <span style={{ opacity: 0.4 }}>—</span>;
  }
}