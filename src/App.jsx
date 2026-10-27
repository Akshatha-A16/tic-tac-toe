import { useEffect, useState } from 'react';
import { gameApi } from './api/gameApi.js';
import { MODES, STATUS } from './game/engine.js';
import Board from './components/Board.jsx';
import MoveHistory from './components/MoveHistory.jsx';
import Scoreboard from './components/Scoreboard.jsx';

export default function App() {
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Every action goes through the API; the UI just renders the returned state.
  const call = async (action) => {
    setBusy(true);
    setError('');
    try {
      setGame(await action());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { call(() => gameApi.createGame(MODES.TWO_PLAYER)); }, []);

  if (!game) return <p className="loading">Loading…</p>;

  const isComputer = game.mode === MODES.COMPUTER;

  const handleCellClick = (index) => {
    call(() => gameApi.makeMove(game.gameId, game.currentPlayer, Math.floor(index / 3), index % 3));
  };

  const handleModeChange = (e) => call(() => gameApi.createGame(e.target.value));

  const handleResetScoreboard = async () => {
    try {
      const scoreboard = await gameApi.resetScoreboard();
      setGame((g) => ({ ...g, scoreboard }));
    } catch (err) {
      setError(err.message);
    }
  };

  let statusText = `Current player: ${game.currentPlayer}`;
  if (game.status === STATUS.WON) statusText = `Player ${game.winner} wins!`;
  if (game.status === STATUS.DRAW) statusText = "It's a draw!";

  return (
    <main className="app">
      <h1>Tic Tac Toe</h1>

      <div className="mode">
        <label htmlFor="mode">Game mode: </label>
        <select id="mode" value={game.mode} onChange={handleModeChange} disabled={busy}>
          <option value={MODES.TWO_PLAYER}>Two Player</option>
          <option value={MODES.COMPUTER}>Play Against Computer</option>
        </select>
        {isComputer && <span className="hint">You are X, computer is O</span>}
      </div>

      <p className={`status ${game.status !== STATUS.IN_PROGRESS ? 'done' : ''}`} role="status">
        {statusText}
      </p>
      {error && <p className="error" role="alert">{error}</p>}

      <div className="layout">
        <section>
          <Board
            board={game.board}
            winningCells={game.winningCells}
            disabled={busy || game.status !== STATUS.IN_PROGRESS}
            onCellClick={handleCellClick}
          />
          <div className="actions">
            <button onClick={() => call(() => gameApi.undo(game.gameId))} disabled={busy || !game.canUndo}>
              Undo Last Move
            </button>
            <button onClick={() => call(() => gameApi.resetGame(game.gameId))} disabled={busy}>
              Reset Game
            </button>
          </div>
        </section>

        <aside>
          <Scoreboard scoreboard={game.scoreboard} onReset={handleResetScoreboard} />
          <MoveHistory moves={game.moves} />
        </aside>
      </div>
    </main>
  );
}
