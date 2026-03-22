import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAppStore }  from '../../store/useAppStore';
import puzzleData       from '../../data/boardClears.json';
import PuzzleBoard      from '../Board/PuzzleBoard';
import { motion }       from 'framer-motion';

export default function BoardClearView() {
  const { loadPuzzle } = useGameStore();
  const difficulty     = useAppStore(s => s.difficulty);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [puzzles, setPuzzles] = useState([]);

  useEffect(() => {
    // Filter puzzles by difficulty. If none exist, fallback to all.
    let filtered = puzzleData.filter(p => p.difficulty === difficulty);
    if (filtered.length === 0) filtered = puzzleData;
    setPuzzles(filtered);
    setCurrentIndex(0);
  }, [difficulty]);

  useEffect(() => {
    if (puzzles.length > 0) {
      loadPuzzle(puzzles[currentIndex]);
    }
  }, [puzzles, currentIndex, loadPuzzle]);

  const handleNextPuzzle = () => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached the end — circle back or go to menu? Let's menu for now.
      useAppStore.getState().goTo('menu');
    }
  };

  if (puzzles.length === 0) {
    return <div className="text-white text-center mt-20">Loading puzzles...</div>;
  }

  return (
    <motion.div
      key="board_clear"
      className="flex flex-col items-center py-6 px-4"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <PuzzleBoard onNextPuzzle={handleNextPuzzle} />
    </motion.div>
  );
}
