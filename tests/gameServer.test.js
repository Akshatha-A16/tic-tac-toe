import { describe, it, expect, beforeEach } from 'vitest';
import { createGameServer, ApiError } from '../src/api/gameServer.js';
import { MODES, STATUS } from '../src/game/engine.js';

let server;
beforeEach(() => { server = createGameServer(); });

const xWinsTopRow = (id) => {
  server.makeMove(id, { player: 'X', row: 0, col: 0 });
  server.makeMove(id, { player: 'O', row: 1, col: 0 });
  server.makeMove(id, { player: 'X', row: 0, col: 1 });
  server.makeMove(id, { player: 'O', row: 1, col: 1 });
  return server.makeMove(id, { player: 'X', row: 0, col: 2 });
};

describe('game API', () => {
  it('creates a game with the full state response', () => {
    const g = server.createGame({ mode: MODES.TWO_PLAYER });
    expect(g).toMatchObject({
      gameId: '1', currentPlayer: 'X', mode: MODES.TWO_PLAYER, status: STATUS.IN_PROGRESS,
      winner: null, winningCells: [], moves: [], canUndo: false,
      scoreboard: { xWins: 0, oWins: 0, draws: 0 },
    });
    expect(server.getGame('1').gameId).toBe('1');
  });

  it('returns 400 for an invalid move and 404 for an unknown game', () => {
    const { gameId } = server.createGame();
    server.makeMove(gameId, { player: 'X', row: 0, col: 0 });
    expect(() => server.makeMove(gameId, { player: 'O', row: 0, col: 0 }))
      .toThrow(expect.objectContaining({ status: 400 }));
    expect(() => server.getGame('nope')).toThrow(ApiError);
  });

  it('updates the scoreboard once for a completed game', () => {
    const { gameId } = server.createGame();
    const g = xWinsTopRow(gameId);
    expect(g.scoreboard.xWins).toBe(1);
    // Further calls on the finished game must not score it again.
    expect(() => server.makeMove(gameId, { player: 'O', row: 2, col: 2 })).toThrow();
    expect(() => server.undo(gameId)).toThrow();
    expect(server.getGame(gameId).scoreboard.xWins).toBe(1);
    expect(server.getScoreboard()).toEqual({ xWins: 1, oWins: 0, draws: 0 });
  });

  it('reset game keeps the scoreboard; reset scoreboard clears it', () => {
    const { gameId } = server.createGame();
    xWinsTopRow(gameId);
    const g = server.resetGame(gameId);
    expect(g.moves).toEqual([]);
    expect(g.status).toBe(STATUS.IN_PROGRESS);
    expect(g.scoreboard.xWins).toBe(1);
    expect(server.resetScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 0 });
  });

  it('computer replies automatically after the human move', () => {
    const { gameId } = server.createGame({ mode: MODES.COMPUTER });
    const g = server.makeMove(gameId, { player: 'X', row: 0, col: 0 });
    expect(g.moves).toHaveLength(2);
    expect(g.moves[1]).toMatchObject({ player: 'O', row: 1, col: 1 }); // takes center
    expect(g.currentPlayer).toBe('X');
  });

  it('computer does not move after the game is completed', () => {
    const { gameId } = server.createGame({ mode: MODES.COMPUTER });
    // Computer answers: 0, 2, 7, 5. X's 9th move (cell 6) ends the game in a draw.
    let g;
    for (const i of [4, 8, 1, 3, 6]) {
      g = server.makeMove(gameId, { player: 'X', row: Math.floor(i / 3), col: i % 3 });
    }
    expect(g.moves.map((m) => m.index)).toEqual([4, 0, 8, 2, 1, 7, 3, 5, 6]);
    expect(g.status).toBe(STATUS.DRAW);
    expect(g.moves[8].player).toBe('X');
    expect(g.scoreboard.draws).toBe(1);
    expect(() => server.makeMove(gameId, { player: 'O', row: 0, col: 0 })).toThrow('completed');
  });

  it('undo in computer mode removes both moves through the API', () => {
    const { gameId } = server.createGame({ mode: MODES.COMPUTER });
    server.makeMove(gameId, { player: 'X', row: 0, col: 0 });
    const g = server.undo(gameId);
    expect(g.moves).toEqual([]);
    expect(g.currentPlayer).toBe('X');
    expect(g.canUndo).toBe(false);
  });
});
