import React, { useMemo, useState } from "react";

const VALUES = [100, 200, 300, 400, 500];

export default function JeopardyCell({ person, gameKey, api }) {
  const k = `${person}|${gameKey}`;
  const total = api.totals[k] ?? 0;
  const isPending = !!api.pending[k];
  const error = api.errors[k] || "";

  const [val, setVal] = useState(100);
  const valOpts = useMemo(() => VALUES, []);

  const submit = () => {
    api.runAction(
      {
        person,
        game: gameKey,        // "jeopardy"
        type: "add",
        amount: val,
        meta: { value: val }  // optional
      },
      val // optimistic delta
    );
    setTimeout(() => setVal(100), 0);
  };

  return (
    <div className="cell-wrap">
      <div className="total" aria-live="polite">{total}</div>
      <div className="controls">
        <label className="sr-only" htmlFor={`jp-${k}-v`}>Jeopardy Value</label>
        <select
          id={`jp-${k}-v`}
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value, 10))}
          disabled={isPending}
        >
          {valOpts.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <button onClick={submit} disabled={isPending} className="btn small">
          OK
        </button>
      </div>
      {error ? <div className="error">Try again</div> : null}
    </div>
  );
}