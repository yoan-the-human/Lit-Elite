# Lit-Elite

A strategic, turn-based card drafting and battling game built with React and Vite. Players go head-to-head against an intelligent AI opponent, navigating a two-tier drafting phase to craft the ultimate deck before entering the battle arena.

---

## 🎮 Game Flow & Features

*   **Dual-Stage Drafting:** 
    *   **Draft Phase:** Establish your core deck from a pool of standard tactical cards.
    *   **Elite Draft Phase:** Select unique high-tier cards to define your playstyle and gain a competitive edge.
*   **Adaptive AI Opponent:** Play solo against an AI (`aiOpponent.js`) that dynamically drafts its own deck and makes calculated tactical decisions on the battlefield.
*   **Dynamic Battle Arena:** A fully interactive Game Board (`GameBoard.jsx`) displaying play zones, health indicators, card statuses, and animated turn transitions via the Turn Overlay (`TurnOverlay.jsx`).
*   **Real-time Game Logs:** Track every action, card play, and damage instance as it happens with the integrated battle log (`GameLogs.jsx`).
*   **Decoupled Architecture:** The game state logic (`gameEngine.js`) and deck mechanics (`deckBuilder.js`) are written in pure JavaScript, separating core logic cleanly from the React rendering layer.

---

## 🛠️ Tech Stack

*   **Framework:** [React 18+](https://react.dev/) (Functional components & hooks)
*   **Build Tool:** [Vite](https://vitejs.dev/) (Blazing fast local development and bundling)
*   **Styling:** Custom modular CSS
*   **Linter:** ESLint (configured via `eslint.config.js`)
*   **Version Management:** standard semantic-release practices (configured with `.versionrc.json`)

---

## 📂 Project Structure

```text
Lit-Elite/
├── dist/                  # Production builds
├── public/                # Static assets (favicons, svgs)
└── src/
    ├── assets/            # Game images and branding
    ├── components/        # React UI components
    │   ├── Card.jsx            # Card rendering & interactions
    │   ├── DraftPhase.jsx      # Initial standard draft UI
    │   ├── EliteDraftPhase.jsx # High-tier card drafting UI
    │   ├── GameBoard.jsx       # Main battle board
    │   ├── GameLogs.jsx        # Side panel tracking actions
    │   └── TurnOverlay.jsx     # Visual indicator for turn swaps
    ├── game/              # Core JavaScript logic
    │   ├── aiOpponent.js       # AI decision-making algorithms
    │   ├── deckBuilder.js      # Card pool & deck generation
    │   └── gameEngine.js       # State machine, rules, and scoring
    ├── App.jsx            # Application layout & state hub
    └── main.jsx           # React entry point
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18 or higher recommended) and **npm** installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yoan-the-human/Lit-Elite.git
   cd Lit-Elite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).*

### Building for Production

To compile and optimize the game for deployment:
```bash
npm run build
```
The output files will be generated in the `dist/` directory. You can preview the production build locally using:
```bash
npm run preview
```

---

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.