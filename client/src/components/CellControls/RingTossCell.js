import React, { useMemo, useState } from "react";

const VALUES = [25, 50, 75, 100];

export default function RingTossCell({ person, gameKey, api }) {
  const k = `${person}|${gameKey}`;
  const total = api.totals[k] ?? 0;
  const isPending = !!api.pending[k];
  const error = api.errors[k] || "";

  const [amt, setAmt] = useState(25);
  const options = useMemo(() => VALUES, []);

  const submit = () => {
    api.runAction(
      {
        person,
        game: gameKey,
        type: "add",
        amount: amt,
      },
      amt
    );
  };

  return (
    <div className="cell-wrap">
      <div className="total" aria-live="polite">{total}</div>
      <div className="controls">
        <label className="sr-only" htmlFor={`rt-${k}`}>Add ring toss points</label>
        <select
          id={`rt-${k}`}
          value={amt}
          onChange={(e) => setAmt(parseInt(e.target.value, 10))}
          disabled={isPending}
        >
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button onClick={submit} disabled={isPending} className="btn small">
          OK
        </button>
      </div>
      {error ? <div className="error">Try again</div> : null}
    </div>
  );
}