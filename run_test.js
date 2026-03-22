import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('src/store/useGameStore.js', 'utf8');
content = content.replace('saveSnapshot: () => {\n    set(state => ({\n      pastStates: [...state.pastStates, {', `saveSnapshot: () => {
    set(state => {
      try {
        return {
          pastStates: [...state.pastStates, {`);
content = content.replace('pendingBattlecry: structuredClone(state.pendingBattlecry),\n      }]\n    }));\n  },', `pendingBattlecry: structuredClone(state.pendingBattlecry),
      }]
          };
      } catch (e) {
        console.error("CLONE ERROR", e);
        return {};
      }
    });
  },`);
writeFileSync('src/store/useGameStore.js', content);
