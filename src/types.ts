export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS',
  WASTED = 'WASTED',
  IPO = 'IPO'
}

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctIndex: number;
  humbugInsight: string;
}

export interface Bank {
  id: number;
  questions: Question[];
  completed: boolean;
  score: number;
}

export interface Session {
  id: number;
  title: string;
  description: string;
  tagline: string;
  banks: Bank[];
}

export interface GameState {
  status: GameStatus;
  currentSessionId: number | null;
  currentBankId: number | null;
  currentQuestionIndex: number;
  competenceScore: number;
  consecutiveWrong: number;
  totalCorrect: number;
  totalWrong: number;
  sessionProgress: Record<number, number>;
  lastBrief: string | null;
  showInsight: string | null;
}

export interface Reaction {
  text: string;
  subtext: string;
  bg: string;
  emoji: string;
  effect: string;
  textColor: string;
}
