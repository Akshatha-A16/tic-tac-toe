import { describe, it, expect } from 'vitest';
import {
  MODES, STATUS, createGameState, applyMove, undoMove, canUndo,
  getComputerMove, resetGameState, createScoreboard, addResult,
} from '../src/game/engine.js';

// Plays moves in order, alternating X/O starting from the current player.
const play = (state, cells) =>
  cells.reduce((s, [row, col]) => applyMove(s, { player: s.currentPlayer, row, col }), state);

const board = (str) => str.split('').map((c) => (c === '.' ? null : c));

describe('moves and turns', () => {
  it('applies a valid move', () => {
    const s = applyMove(createGameState('1'), { player: 'X', row: 0, col: 0 });
    expect(s.board[0]).toBe('X');
    expect(s.moves).toEqual([{ moveNumber: 1, player: 'X', row: 0, col: 0, index: 0 }]);
  });

  it('switches turns after a valid move', () => {
    let s = createGameState('1');
    expect(s.currentPlayer).toBe('X');
    s = applyMove(s, { player: 'X', row: 0, col: 0 });
    expect(s.currentPlayer).toBe('O');
    s = applyMove(s, { player: 'O', row: 1, col: 1 });
    expect(s.currentPlayer).toBe('X');
  });

  it('rejects a move on an occupied cell and keeps the turn', () => {
    const s = applyMove(createGameState('1'), { player: 'X', row: 0, col: 0 });
    expect(() => applyMove(s, { player: 'O', row: 0, col: 0 })).toThrow('occupied');
    expect(s.currentPlayer).toBe('O');
  });

  it('rejects a move outside the board', () => {
    const s = createGameState('1');
    expect(() => applyMove(s, { player: 'X', row: 3, col: 0 })).toThrow('outside');
    expect(() => applyMove(s, { player: 'X', row: 0, col: -1 })).toThrow('outside');
  });

  it('rejects a move by the wrong player', () => {
    const s = createGameState('1');
    expect(() => applyMove(s, { player: 'O', row: 0, col: 0 })).toThrow("X's turn");
  });

  it('rejects a move after the game is completed', () => {
    const s = play(createGameState('1'), [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    expect(s.status).toBe(STATUS.WON);
    expect(() => applyMove(s, { player: 'O', row: 2, col: 2 })).toThrow('completed');
  });
});

describe('win and draw detection', () => {
  it('detects a row win', () => {
    const s = play(createGameState('1'), [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    expect(s.status).toBe(STATUS.WON);
    expect(s.winner).toBe('X');
    expect(s.winningCells).toEqual([0, 1, 2]);
  });

  it('detects a column win', () => {
    const s = play(createGameState('1'), [[0, 0], [0, 1], [1, 0], [1, 1], [2, 2], [2, 1]]);
    expect(s.winner).toBe('O');
    expect(s.winningCells).toEqual([1, 4, 7]);
  });

  it('detects a diagonal win', () => {
    const s = play(createGameState('1'), [[0, 0], [0, 1], [1, 1], [0, 2], [2, 2]]);
    expect(s.winner).toBe('X');
    expect(s.winningCells).toEqual([0, 4, 8]);
  });

  it('detects a draw', () => {
    // X O X / X O O / O X X
    const s = play(createGameState('1'), [
      [0, 0], [0, 1], [0, 2], [1, 1], [1, 0], [1, 2], [2, 1], [2, 0], [2, 2],
    ]);
    expect(s.status).toBe(STATUS.DRAW);
    expect(s.winner).toBeNull();
  });
});

describe('reset', () => {
  it('clears board, history and status and sets turn to X', () => {
    const played = play(createGameState('1', MODES.COMPUTER), [[0, 0], [1, 1], [0, 1]]);
    const s = resetGameState(played);
    expect(s.board.every((c) => c === null)).toBe(true);
    expect(s.moves).toEqual([]);
    expect(s.status).toBe(STATUS.IN_PROGRESS);
    expect(s.currentPlayer).toBe('X');
    expect(s.mode).toBe(MODES.COMPUTER);
  });
});

describe('undo', () => {
  it('removes only the last move in two-player mode', () => {
    const s = undoMove(play(createGameState('1'), [[0, 0], [1, 1]]));
    expect(s.moves).toHaveLength(1);
    expect(s.board[4]).toBeNull();
    expect(s.currentPlayer).toBe('O');
  });

  it('removes the computer move and the human move in computer mode', () => {
    const s = undoMove(play(createGameState('1', MODES.COMPUTER), [[0, 0], [1, 1]]));
    expect(s.moves).toHaveLength(0);
    expect(s.board.every((c) => c === null)).toBe(true);
    expect(s.currentPlayer).toBe('X');
  });

  it('is not allowed with no moves', () => {
    const s = createGameState('1');
    expect(canUndo(s)).toBe(false);
    expect(() => undoMove(s)).toThrow();
  });

  it('is not allowed after the game is completed (Option A)', () => {
    const s = play(createGameState('1'), [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]);
    expect(canUndo(s)).toBe(false);
    expect(() => undoMove(s)).toThrow();
  });
});

describe('computer move selection', () => {
  it('plays the winning move first', () => {
    // O can win at 5, X could also win at 2
    expect(getComputerMove(board('XX.OO.X..'))).toBe(5);
  });

  it('blocks X when O cannot win', () => {
    expect(getComputerMove(board('XX..O....'))).toBe(2);
  });

  it('takes the center when free', () => {
    expect(getComputerMove(board('X........'))).toBe(4);
  });

  it('takes a corner when the center is taken', () => {
    expect(getComputerMove(board('....X....'))).toBe(0);
  });

  it('takes any cell when no corner or center is free', () => {
    // Center and all corners taken, only edge cell 3 is free
    expect(getComputerMove(board('XOX.OXOXO'))).toBe(3);
  });

  it('returns null on a full board', () => {
    expect(getComputerMove(board('XOXXOOOXX'))).toBeNull();
  });
});

describe('scoreboard', () => {
  it('adds wins and draws', () => {
    let sb = createScoreboard();
    sb = addResult(sb, { status: STATUS.WON, winner: 'X' });
    sb = addResult(sb, { status: STATUS.WON, winner: 'O' });
    sb = addResult(sb, { status: STATUS.DRAW, winner: null });
    sb = addResult(sb, { status: STATUS.IN_PROGRESS, winner: null });
    expect(sb).toEqual({ xWins: 1, oWins: 1, draws: 1 });
  });
});
