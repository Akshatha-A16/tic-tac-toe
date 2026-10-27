// Frontend API client. The UI only talks to these functions.
// Today they call the in-memory server; to use a real backend, replace each body
// with a fetch() call to the endpoint in the comment. The UI does not need to change.
import { createGameServer } from './gameServer.js';

const server = createGameServer();

// Mimics an HTTP round trip: async, and errors come back as ApiError (400/404).
const request = (fn) => new Promise((resolve, reject) => {
  try { resolve(fn()); } catch (err) { reject(err); }
});

export const gameApi = {
  createGame: (mode) => request(() => server.createGame({ mode })),          // POST /api/games
  getGame: (id) => request(() => server.getGame(id)),                         // GET  /api/games/{id}
  makeMove: (id, player, row, col) =>
    request(() => server.makeMove(id, { player, row, col })),                 // POST /api/games/{id}/moves
  undo: (id) => request(() => server.undo(id)),                               // POST /api/games/{id}/undo
  resetGame: (id) => request(() => server.resetGame(id)),                     // POST /api/games/{id}/reset
  getScoreboard: () => request(() => server.getScoreboard()),                 // GET  /api/scoreboard
  resetScoreboard: () => request(() => server.resetScoreboard()),             // POST /api/scoreboard/reset
};
