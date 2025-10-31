import React, { useMemo, useState } from "react";

const VALUES = [25, 50, 75, 100];

export default function EyeTossCell({ person, gameKey, api }) {
  const k = `${person}|${gameKey}`;
  const total = api.totals[k] ?? 0;
  const isPending = !!api.pending[k];
  const error = api.errors[k] || "";

  const [val, setVal] = useState(25);
  const valOpts = useMemo(() => VALUES, []);

  const submit = () => {
    api.runAction(
      {
        person,
        game: gameKey,
        type: "add",
        amount: val,
      },
      val
    );
    setTimeout(() => setVal(25), 0);
  };

  return (
    <div className="cell-wrap">
      <div className="total" aria-live="polite">{total}</div>
      <div className="controls">
        <label className="sr-only" htmlFor={`et-${k}-v`}>Eye Toss Value</label>
        <select
          id={`et-${k}-v`}
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value, 10))}
          disabled={isPending}
        >
          {valOpts.map((v) => (
            <option key={v} value={v}>{v}</option>
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