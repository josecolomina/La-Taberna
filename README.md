# 🃏 Hearthstone Trainer

> An advanced React-based state engine and training simulator for Hearthstone mechanics.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-%2320232a.svg?style=for-the-badge&logo=react)
![Framer](https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue)
![Vitest](https://img.shields.io/badge/Vitest-%2344A833.svg?style=for-the-badge&logo=vitest&logoColor=white)

## 📌 Overview

**Hearthstone Trainer** is not just another UI clone—it is a rigorous, custom-built training engine. Designed for competitive players and developers alike, it accurately reconstructs core Hearthstone mechanics from scratch. Test your skills in **Lethal puzzles**, **Board Clear challenges**, and **Mulligan simulators** governed by a strict, immutable state engine tailored for complex card interactions.

![Demo GIF](ruta-al-gif)

## 🚀 Technical Highlights

- **Custom State Engine:** A bulletproof engine handling strict game rules including the 7-minion board limit, dynamic mana validation, and exhaustive aura recalculations. Features an advanced multi-route validation algorithm evaluating user actions against optimal (`BEST`) and sub-optimal (`GOOD`/`BAD`) play paths.
- **Time Machine (Undo):** Players never get stuck. Featuring a fully integrated chronological history logger, powered by deep state cloning (`structuredClone`), allowing precise step-by-step un-dos and branching decisions.
- **Zero-Dependency Audio:** Immersive sound effects are generated on the fly leveraging the native Web Audio API (`AudioContext`). No heavy `.mp3` payloads—just pure, synthesized acoustic feedback.
- **100% Test Coverage:** The game engine's integrity is protected by an extensive Vitest suite. With over 56 passing tests ensuring edge cases like Divine Shield, Poisonous, and complex Battlecries run perfectly.

## 🏗️ Architecture

The application scales effortlessly using a decoupled [Zustand](https://github.com/pmndrs/zustand) slice architecture:
1. **App Store (`useAppStore`):** Orchestrates global application UI, view routing, modal states, and visual viewport locking.
2. **Game Engine (`useGameStore`):** The heart of the simulator. Manages the event queue, board state, strict sequence evaluation, and the robust undo functionality.
3. **Mulligan Store (`useMulliganStore`):** Handles statistical probability simulators, starting hand logic, and deck mulligan scenarios.
4. **User Progression (`useUserStore`):** Tracks XP, leveling, solved metrics, and player preferences with `localStorage` persistence.

## 🛠️ Tooling & Content Pipeline

Adding new puzzles to the simulator is a breeze. Our bespoke backend parser reads JSON payloads and automatically fetches missing database IDs from HearthstoneJSON.

Simply add your puzzle structure into the data files with temporary sequence aliases like `AGENT_OF_THE_OLD_ONES_ID`, and run:
```bash
npm run fix-puzzles
```
The Node.js script will hydrate the local files with the official `cardId`s and cache the payload in a split second.

## 📦 Getting Started

Ready to jump into the Tavern? Check out the code and run it locally.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/hearthstone-trainer.git

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev

# 4. Run the Vitest engine test suite
npm run test
```
