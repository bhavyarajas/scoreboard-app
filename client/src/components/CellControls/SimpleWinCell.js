import React from "react";

export default function SimpleWinCell({ person, gameKey, api }) {
  const k = `${person}|${gameKey}`;
  const total = api.totals[k] ?? 0;
  const isPending = !!api.pending[k];
  const error = api.errors[k] || "";

  // per-game scoring rules (frontend)
  // must match backend
  const winAmounts = {
    pin_spider: 150,
    mime: 125,
    eye_toss: 200,
    roulette: 250,
    bingo: 150,
  };

  const lossAmounts = {
    eye_toss: -100,
    roulette: -100,
  };

  const isWinLossGame = gameKey === "eye_toss" || gameKey === "roulette";

  const sendWin = () => {
    const amt = winAmounts[gameKey] ?? 1; // fallback
    // for consistency, send "add" so server knows exact amount
    api.runAction(
      { person, game: gameKey, type: "add", amount: amt },
      amt
    );
  };

  const sendLoss = () => {
    const amt = lossAmounts[gameKey];
    if (typeof amt === "number") {
      api.runAction(
        { person, game: gameKey, type: "add", amount: amt },
        amt
      );
    }
  };

  return (
    <div className="cell-wrap">
      <div className="total" aria-live="polite">
        {total}
      </div>
      <div className="controls">
        <button onClick={sendWin} disabled={isPending} className="btn small">
          Won
        </button>
        {isWinLossGame ? (
          <button onClick={sendLoss} disabled={isPending} className="btn small">
            Loss
          </button>
        ) : null}
      </div>
      {error ? <div className="error">Try again</div> : null}
    </div>
  );
}