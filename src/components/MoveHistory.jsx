export default function MoveHistory({ moves }) {
  return (
    <div className="panel">
      <h2>Move History</h2>
      {moves.length === 0 ? (
        <p className="muted">No moves yet</p>
      ) : (
        <table>
          <thead>
            <tr><th>Move</th><th>Player</th><th>Position</th></tr>
          </thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.moveNumber}>
                <td>{m.moveNumber}</td>
                <td>{m.player}</td>
                <td>Row {m.row + 1}, Column {m.col + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
