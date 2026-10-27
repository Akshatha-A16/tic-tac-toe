// In-memory "server": owns all game sessions and the scoreboard.
// Each method matches one REST endpoint from the spec.
import {
  MODES, PLAYER_O, STATUS, GameError,
  createGameState, applyMove, undoMove, resetGameState,
  getComputerMove, toRowCol, canUndo,
  createScoreboard, addResult,
} from '../game/engine.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function createGameServer() {
  const games = new Map();
  let scoreboard = createScoreboard();
  let nextId = 1;

  const newId = () => String(nextId++);

  const getOrThrow = (id) => {
    const game = games.get(id);
    if (!game) throw new ApiError(404, `Game ${id} not found`);
    return game;
  };

  // The response the frontend renders. Copies so callers can't mutate server state.
  const toResponse = (game) => structuredClone({
    gameId: game.id,
    board: game.board,
    currentPlayer: game.currentPlayer,
    mode: game.mode,
    status: game.status,
    winner: game.winner,
    winningCells: game.winningCells,
    moves: game.moves,
    canUndo: canUndo(game),
    scoreboard,
  });

  const save = (game) => {
    // Score each finished game exactly once.
    if (game.status !== STATUS.IN_PROGRESS && !game.scored) {
      scoreboard = addResult(scoreboard, game);
      game = { ...game, scored: true };
    }
    games.set(game.id, game);
    return game;
  };

  const run = (fn) => {
    try {
      return fn();
    } catch (err) {
      if (err instanceof GameError) throw new ApiError(400, err.message);
      throw err;
    }
  };

  return {
    // POST /api/games  { mode }
    createGame({ mode = MODES.TWO_PLAYER } = {}) {
      return run(() => toResponse(save(createGameState(newId(), mode))));
    },

    // GET /api/games/{id}
    getGame(id) {
      return toResponse(getOrThrow(id));
    },

    // POST /api/games/{id}/moves  { player, row, col }
    makeMove(id, move) {
      return run(() => {
        let game = save({ ...applyMove(getOrThrow(id), move), scored: false });

        if (game.mode === MODES.COMPUTER && game.status === STATUS.IN_PROGRESS && game.currentPlayer === PLAYER_O) {
          const { row, col } = toRowCol(getComputerMove(game.board));
          game = save({ ...applyMove(game, { player: PLAYER_O, row, col }), scored: false });
        }
        return toResponse(game);
      });
    },

    // POST /api/games/{id}/undo
    undo(id) {
      return run(() => toResponse(save({ ...undoMove(getOrThrow(id)), scored: false })));
    },

    // POST /api/games/{id}/reset  (keeps mode and scoreboard)
    resetGame(id) {
      const game = getOrThrow(id);
      return toResponse(save(resetGameState(game)));
    },

    // GET /api/scoreboard
    getScoreboard() {
      return structuredClone(scoreboard);
    },

    // POST /api/scoreboard/reset
    resetScoreboard() {
      scoreboard = createScoreboard();
      return structuredClone(scoreboard);
    },
  };
}
