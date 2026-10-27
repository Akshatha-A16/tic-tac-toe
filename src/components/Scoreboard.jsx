export default function Scoreboard({ scoreboard, onReset }) {
  return (
    <div className="panel">
      <h2>Scoreboard</h2>
      <div className="scores">
        <div><span>X Wins</span><strong>{scoreboard.xWins}</strong></div>
        <div><span>O Wins</span><strong>{scoreboard.oWins}</strong></div>
        <div><span>Draws</span><strong>{scoreboard.draws}</strong></div>
      </div>
      <button onClick={onReset}>Reset Scoreboard</button>
    </div>
  );
}
