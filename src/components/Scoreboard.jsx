export default function Scoreboard({ scoreboard, onReset }) {
  const isEmpty = scoreboard.xWins + scoreboard.oWins + scoreboard.draws === 0;
  return (
    <div className="panel">
      <h2>Scoreboard</h2>
      <div className="scores">
        <div><span>X Wins</span><strong>{scoreboard.xWins}</strong></div>
        <div><span>O Wins</span><strong>{scoreboard.oWins}</strong></div>
        <div><span>Draws</span><strong>{scoreboard.draws}</strong></div>
      </div>
      <button onClick={onReset} disabled={isEmpty}>Reset Scoreboard</button>
    </div>
  );
}
