# Tic Tac Toe (React)

## 1. Project overview

A browser-based Tic Tac Toe game with Two Player mode and a Play Against Computer mode, move history, undo, and a session scoreboard.

All game rules live in a pure JavaScript game engine. The React UI never applies rules itself: it calls an API layer and renders the state it gets back, the same way it would with a REST backend.

## 2. Tech stack

- **Frontend:** React 19 + Vite
- **"Backend":** in-memory game server written in plain JavaScript (`src/api/gameServer.js` + `src/game/engine.js`)
- **API style:** REST-shaped API client (`src/api/gameApi.js`), one function per endpoint
- **Storage:** in memory (resets when the page reloads)
- **Tests:** Vitest
- **Source control:** Git + GitHub

## 3. Features implemented

- 3 × 3 board; empty cells are clickable, filled cells are locked
- Current player shown; turns alternate only after a valid move
- Win detection for rows, columns and diagonals, with winning cells highlighted
- Draw detection
- Board locked once the game is won or drawn
- Move history table (move number, player, row/column)
- Undo Last Move
  - Two Player mode: removes the last move
  - Computer mode: removes the computer's move and the human move before it
  - Disabled when there are no moves, and after the game is completed
- Scoreboard (X wins, O wins, draws), updated exactly once per finished game
- Reset Game (keeps the scoreboard) and Reset Scoreboard
- Computer opponent (O) with this priority: win, block X, center, corner, any cell
- Validation: rejects moves outside the board, on occupied cells, after completion, or by the wrong player

## 4. How to run the backend locally

There is no separate backend process. The game server runs in memory inside the app (see section 10), so starting the frontend starts everything.

## 5. How to run the frontend locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To make a production build: `npm run build`, then `npm run preview`.

## 6. API endpoint summary

Each function in `src/api/gameApi.js` maps to one REST endpoint. Rows and columns are **0-based** in the API (0–2) and shown **1-based** in the UI.

| Method | Endpoint | Function | Body | Purpose |
|---|---|---|---|---|
| POST | `/api/games` | `createGame(mode)` | `{ mode: "TwoPlayer" \| "Computer" }` | Create a new game session |
| GET | `/api/games/{id}` | `getGame(id)` | | Get current game state |
| POST | `/api/games/{id}/moves` | `makeMove(id, player, row, col)` | `{ player, row, col }` | Submit a move (computer replies automatically in Computer mode) |
| POST | `/api/games/{id}/undo` | `undo(id)` | | Undo last move (or move pair in Computer mode) |
| POST | `/api/games/{id}/reset` | `resetGame(id)` | | Reset the current game, keep mode and scoreboard |
| GET | `/api/scoreboard` | `getScoreboard()` | | Get scoreboard |
| POST | `/api/scoreboard/reset` | `resetScoreboard()` | | Reset scoreboard |

**Game state response**

```json
{
  "gameId": "1",
  "board": ["X", null, null, null, "O", null, null, null, null],
  "currentPlayer": "X",
  "mode": "Computer",
  "status": "InProgress",
  "winner": null,
  "winningCells": [],
  "moves": [
    { "moveNumber": 1, "player": "X", "row": 0, "col": 0, "index": 0 },
    { "moveNumber": 2, "player": "O", "row": 1, "col": 1, "index": 4 }
  ],
  "canUndo": true,
  "scoreboard": { "xWins": 0, "oWins": 0, "draws": 0 }
}
```

`status` is one of `InProgress`, `Won`, `Draw`. `board` is 9 cells, indexed row by row (index = row × 3 + col).

**Errors:** invalid moves return an error with `status: 400` and a message (for example `"Cell is already occupied"`); an unknown game id returns `status: 404`. The UI shows the message.

## 7. How to run tests

```bash
npm test
```

`tests/engine.test.js` covers the game rules: valid move, invalid moves (occupied, outside the board, wrong player), turn switching, row/column/diagonal wins, draw, reset, undo in both modes, undo disabled after completion, each step of the computer's move priority, and scoreboard counting.

`tests/gameServer.test.js` covers the API layer: the state response shape, 400/404 errors, the scoreboard updating only once per game, reset game vs. reset scoreboard, the computer replying automatically, the computer not moving after the game ends, and computer-mode undo.

## 8. AI tools and prompt summary

- **Tool:** Claude (Claude Code), used as a pair programmer.
- **Main prompt:** I gave it the full problem statement and asked it to analyse it first, then build a React-only version (no .NET), keeping the "backend owns the state" idea by putting the rules in a separate engine and API layer, choosing Option A for undo, and including tests and this README.
- **What AI generated:** the project scaffold, game engine, API layer, React components, CSS, tests and a first draft of this README.
- **What I reviewed carefully:** the undo logic in Computer mode, the scoreboard counting once per game, move validation, and the computer move priority order.
- **What I changed manually:** _(fill in what you changed, for example styling, wording, extra tests)_

## 9. Design decisions

- **Rules separated from UI.** `engine.js` is pure functions (state in, new state out) with no React. This makes the rules easy to test and easy to port to a real backend.
- **API layer as the boundary.** The UI only calls `gameApi`. Swapping it for real `fetch()` calls to a .NET or Node server would not change any component.
- **State is rebuilt from the move list.** Board, turn, winner and status are always calculated from `moves`. Undo just removes moves and recalculates, so history and board can't drift apart.
- **Scoreboard counted on the server side.** A `scored` flag on each game ensures a finished game is counted exactly once.
- **Computer moves on the server side.** After a valid human move in Computer mode, the server plays O in the same request, so the UI never decides the computer's move.

## 10. Clarifications and assumptions

- **React only, no .NET backend.** The problem statement asks for a .NET backend. I built a React-only solution and simulated the backend with an in-memory game server inside the app. The API contract above is what a real backend would expose.
- **Undo after completion: Option A.** Once a game is won or drawn, Undo is disabled, so the scoreboard result for that game is final.
- **Reset Game** clears the board, history and status, sets the turn to X, and keeps the same game id, mode and scoreboard.
- **Changing the mode** starts a new game in that mode; the scoreboard is kept.
- **Computer mode:** human is always X and moves first; the computer is always O.
- **Computer-mode undo** when the last move is X (only possible if X just ended the game, which Option A blocks anyway) removes only that move.
- Rows and columns are 0-based in the API and 1-based in the UI.

## 11. Known limitations

- No real HTTP server: state is lost when the page reloads, and it can't be shared between browser tabs.
- One scoreboard for the whole session, not per player.
- The computer follows a simple fixed priority, so it can be beaten.
- No frontend component tests yet; tests cover the engine and API layer.

## 12. Future improvements

- Replace the in-memory server with a real REST backend (.NET Web API or Node/Express) using the same contract, and point `gameApi.js` at it with `fetch`.
- Store games and scoreboard in SQLite.
- Add React Testing Library tests for components.
- Add a harder computer opponent (minimax).
- Let players enter names and keep per-player stats.
