export default function Board({ board, winningCells, disabled, onCellClick }) {
  return (
    <div className="board">
      {board.map((value, index) => {
        const isWinning = winningCells.includes(index);
        return (
          <button
            key={index}
            className={`cell ${isWinning ? 'winning' : ''} ${value ? value.toLowerCase() : ''}`}
            onClick={() => onCellClick(index)}
            disabled={disabled || value !== null}
            aria-label={`Row ${Math.floor(index / 3) + 1}, Column ${(index % 3) + 1}${value ? `, ${value}` : ''}`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
