// Pure game engine: no React, no browser APIs.
// It plays the role of the "backend" game rules, so it can be unit tested on its own
// and could be ported to a real server (for example .NET) without changing the rules.

export const PLAYER_X = 'X';
export const PLAYER_O = 'O';

export const MODES = {
  TWO_PLAYER: 'TwoPlayer',
  COMPUTER: 'Computer',
};

export const STATUS = {
  IN_PROGRESS: 'InProgress',
  WON: 'Won',
  DRAW: 'Draw',
};

// Cell index layout:
// 0 | 1 | 2
// 3 | 4 | 5
// 6 | 7 | 8
export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

const CENTER = 4;
const CORNERS = [0, 2, 6, 8];

export const toIndex = (row, col) => row * 3 + col;
export const toRowCol = (index) => ({ row: Math.floor(index / 3), col: index % 3 });

export function createGameState(id, mode = MODES.TWO_PLAYER) {
  if (!Object.values(MODES).includes(mode)) {
    throw new GameError(`Unknown game mode: ${mode}`);
  }
  return {
    id,
    mode,
    board: Array(9).fill(null),
    currentPlayer: PLAYER_X,
    status: STATUS.IN_PROGRESS,
    winner: null,
    winningCells: [],
    moves: [],
  };
}

export class GameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameError';
  }
}

export function findWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCells: line };
    }
  }
  return null;
}

// Works out board, turn and status from the move list.
// Undo uses this so the result is always consistent with the history.
export function buildStateFromMoves(base, moves) {
  const board = Array(9).fill(null);
  moves.forEach((m) => { board[m.index] = m.player; });

  const win = findWinner(board);
  let status = STATUS.IN_PROGRESS;
  if (win) status = STATUS.WON;
  else if (moves.length === 9) status = STATUS.DRAW;

  const last = moves[moves.length - 1];
  return {
    ...base,
    board,
    moves,
    status,
    winner: win ? win.winner : null,
    winningCells: win ? win.winningCells : [],
    currentPlayer: last ? otherPlayer(last.player) : PLAYER_X,
  };
}

export const otherPlayer = (p) => (p === PLAYER_X ? PLAYER_O : PLAYER_X);

// Validates and applies a move. Returns a new state, or throws GameError.
export function applyMove(state, { player, row, col }) {
  if (state.status !== STATUS.IN_PROGRESS) {
    throw new GameError('Game is already completed');
  }
  if (player !== PLAYER_X && player !== PLAYER_O) {
    throw new GameError(`Invalid player: ${player}`);
  }
  if (player !== state.currentPlayer) {
    throw new GameError(`It is ${state.currentPlayer}'s turn`);
  }
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 2 || col < 0 || col > 2) {
    throw new GameError('Move is outside the board');
  }
  const index = toIndex(row, col);
  if (state.board[index] !== null) {
    throw new GameError('Cell is already occupied');
  }

  const move = { moveNumber: state.moves.length + 1, player, row, col, index };
  return buildStateFromMoves(state, [...state.moves, move]);
}

export const emptyCells = (board) =>
  board.map((v, i) => (v === null ? i : null)).filter((i) => i !== null);

function findWinningCell(board, player) {
  for (const i of emptyCells(board)) {
    const test = [...board];
    test[i] = player;
    if (findWinner(test)) return i;
  }
  return null;
}

// Computer (O) priority: win > block X > center > corner > any cell.
export function getComputerMove(board, computer = PLAYER_O) {
  const free = emptyCells(board);
  if (free.length === 0) return null;

  const win = findWinningCell(board, computer);
  if (win !== null) return win;

  const block = findWinningCell(board, otherPlayer(computer));
  if (block !== null) return block;

  if (board[CENTER] === null) return CENTER;

  const corner = CORNERS.find((c) => board[c] === null);
  if (corner !== undefined) return corner;

  return free[0];
}

// Option A: undo is only allowed while the game is in progress.
export function canUndo(state) {
  return state.status === STATUS.IN_PROGRESS && state.moves.length > 0;
}

// Two player: remove the last move.
// Computer: remove the computer's last move and the human move before it.
export function undoMove(state) {
  if (!canUndo(state)) {
    throw new GameError('Nothing to undo');
  }
  let moves = state.moves.slice(0, -1);
  const removed = state.moves[state.moves.length - 1];
  if (state.mode === MODES.COMPUTER && removed.player === PLAYER_O && moves.length > 0) {
    moves = moves.slice(0, -1);
  }
  return buildStateFromMoves(state, moves);
}

export function resetGameState(state, newId = state.id) {
  return createGameState(newId, state.mode);
}

export const createScoreboard = () => ({ xWins: 0, oWins: 0, draws: 0 });

// Returns a new scoreboard with the finished game's result added.
export function addResult(scoreboard, state) {
  if (state.status === STATUS.WON && state.winner === PLAYER_X) return { ...scoreboard, xWins: scoreboard.xWins + 1 };
  if (state.status === STATUS.WON && state.winner === PLAYER_O) return { ...scoreboard, oWins: scoreboard.oWins + 1 };
  if (state.status === STATUS.DRAW) return { ...scoreboard, draws: scoreboard.draws + 1 };
  return scoreboard;
}
