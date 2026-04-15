import { create } from 'zustand';

interface BoxingState {
  status: 'idle' | 'loading_model' | 'ready' | 'playing' | 'game_over';
  mode: 'free' | 'challenge_30s';
  score: number;
  combo: number;
  maxCombo: number;
  lastPunchPower: number | null;
  debugMode: boolean;
  
  // Actions
  setStatus: (status: BoxingState['status']) => void;
  setMode: (mode: BoxingState['mode']) => void;
  registerPunch: (power: number) => void;
  resetCombo: () => void;
  toggleDebug: () => void;
  startGame: () => void;
  endGame: () => void;
}

export const useBoxingStore = create<BoxingState>((set) => ({
  status: 'idle',
  mode: 'free',
  score: 0,
  combo: 0,
  maxCombo: 0,
  lastPunchPower: null,
  debugMode: false,

  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  
  registerPunch: (power) => set((state) => {
    const newCombo = state.combo + 1;
    return {
      score: state.score + (10 * newCombo * power),
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      lastPunchPower: power
    };
  }),
  
  resetCombo: () => set({ combo: 0 }),
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
  
  startGame: () => set({ status: 'playing', score: 0, combo: 0, lastPunchPower: null }),
  endGame: () => set({ status: 'game_over' }),
}));
