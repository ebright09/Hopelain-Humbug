import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameStatus, GameState, Reaction } from './types';
import { SESSIONS } from './questions';
import { generateCMOBrief } from './services/geminiService';
import Halo from './components/Halo';

// Correct answer reactions - celebratory and over-the-top
const CORRECT_REACTIONS: Reaction[] = [
  { text: "MARKETING NIRVANA", subtext: "Your WTP just spiked", bg: "bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500", emoji: "🌈", effect: "rainbow-splash", textColor: "text-white" },
  { text: "IPO READY", subtext: "The board is impressed", bg: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500", emoji: "🚀", effect: "psych-burst", textColor: "text-black" },
  { text: "STRATEGIC ASCENSION", subtext: "You've climbed the ladder", bg: "bg-gradient-to-br from-pink-400 via-rose-400 to-red-400", emoji: "🦄", effect: "rainbow-splash", textColor: "text-white" },
  { text: "GO BEARS!", subtext: "Haas would be proud", bg: "bg-gradient-to-br from-[#003262] via-blue-700 to-blue-800", emoji: "🐻", effect: "psych-burst", textColor: "text-[#FDB515]" },
  { text: "WTP OVERFLOW", subtext: "Consumer surplus achieved", bg: "bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500", emoji: "💎", effect: "rainbow-splash", textColor: "text-white" },
  { text: "MCKINSEY CRYING", subtext: "Your strategy is superior", bg: "bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500", emoji: "😭", effect: "psych-burst", textColor: "text-white" },
  { text: "VALUE WEDGE WIDE", subtext: "Margin expands infinitely", bg: "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500", emoji: "📈", effect: "rainbow-splash", textColor: "text-white" },
  { text: "BRAND SOUL INTACT", subtext: "Authenticity confirmed", bg: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500", emoji: "🔥", effect: "psych-burst", textColor: "text-white" },
];

// Incorrect answer reactions - dramatic and humiliating
const INCORRECT_REACTIONS: Reaction[] = [
  { text: "INFERNO", subtext: "Your career burns", bg: "bg-inferno", emoji: "🔥", effect: "shake", textColor: "text-white" },
  { text: "GUILLOTINE", subtext: "Strategic execution", bg: "bg-gradient-to-br from-gray-900 via-black to-gray-900", emoji: "⚔️", effect: "shake", textColor: "text-red-500" },
  { text: "COMMODITY TRAP", subtext: "You are now generic", bg: "bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900", emoji: "💩", effect: "shake", textColor: "text-amber-200" },
  { text: "STRATEGIC CLOWN", subtext: "The board questions you", bg: "bg-gradient-to-br from-white via-gray-100 to-white", emoji: "🤡", effect: "shake", textColor: "text-black" },
  { text: "WRONG!!", subtext: "McKinsey laughs", bg: "bg-gradient-to-br from-red-700 via-red-800 to-red-900", emoji: "❌", effect: "shake", textColor: "text-white" },
  { text: "CAREER LIQUIDATED", subtext: "Pack your desk", bg: "bg-gradient-to-br from-black via-red-950 to-black", emoji: "💀", effect: "shake", textColor: "text-red-500" },
  { text: "WTP COLLAPSE", subtext: "Value wedge implodes", bg: "bg-gradient-to-br from-gray-800 via-gray-900 to-black", emoji: "📉", effect: "shake", textColor: "text-red-400" },
  { text: "BRAND DILUTION", subtext: "Your soul is commodity", bg: "bg-gradient-to-br from-purple-900 via-indigo-900 to-black", emoji: "🌀", effect: "shake", textColor: "text-purple-300" },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.LOBBY,
    currentSessionId: null,
    currentBankId: null,
    currentQuestionIndex: 0,
    competenceScore: 50,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalWrong: 0,
    sessionProgress: {},
    lastBrief: null,
    showInsight: null,
  });

  const [overlay, setOverlay] = useState<Reaction | null>(null);
  const [isBriefLoading, setIsBriefLoading] = useState(false);
  const [particles, setParticles] = useState<{id: number, char: string, x: number, delay: number}[]>([]);

  // Spawn celebratory/sad particles
  const spawnParticles = useCallback((char: string, count: number = 15) => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      char,
      x: Math.random() * 100,
      delay: Math.random() * 0.5
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3000);
  }, []);

  // Start a session
  const startSession = useCallback((sessionId: number, bankId: number) => {
    setGameState(prev => ({
      ...prev,
      status: GameStatus.PLAYING,
      currentSessionId: sessionId,
      currentBankId: bankId,
      currentQuestionIndex: 0,
      competenceScore: 50,
      consecutiveWrong: 0,
      totalCorrect: 0,
      totalWrong: 0,
      showInsight: null,
    }));
  }, []);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (gameState.currentSessionId === null || gameState.currentBankId === null) return null;
    const session = SESSIONS.find(s => s.id === gameState.currentSessionId);
    if (!session) return null;
    const bank = session.banks[gameState.currentBankId - 1];
    if (!bank) return null;
    return bank.questions[gameState.currentQuestionIndex] || null;
  }, [gameState.currentSessionId, gameState.currentBankId, gameState.currentQuestionIndex]);

  // Handle answer selection
  const handleAnswer = useCallback((choiceIndex: number) => {
    if (!currentQuestion) return;

    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    const reactionSet = isCorrect ? CORRECT_REACTIONS : INCORRECT_REACTIONS;
    const randomReaction = reactionSet[Math.floor(Math.random() * reactionSet.length)];
    
    setOverlay(randomReaction);
    spawnParticles(randomReaction.emoji, isCorrect ? 20 : 10);
    
    setTimeout(() => {
      setOverlay(null);
      
      // Show insight for wrong answers
      if (!isCorrect) {
        setGameState(prev => ({ ...prev, showInsight: currentQuestion.humbugInsight }));
        setTimeout(() => {
          setGameState(prev => ({ ...prev, showInsight: null }));
        }, 3000);
      }
    }, isCorrect ? 800 : 1200);

    setGameState(prev => {
      const scoreDelta = isCorrect ? 12 : -20;
      const newCompetence = Math.max(0, Math.min(100, prev.competenceScore + scoreDelta));
      const newTotalCorrect = isCorrect ? prev.totalCorrect + 1 : prev.totalCorrect;
      const newTotalWrong = isCorrect ? prev.totalWrong : prev.totalWrong + 1;
      const newConsecutiveWrong = isCorrect ? 0 : prev.consecutiveWrong + 1;

      // Check for failure: 3 total wrong OR meter hits zero
      if (newTotalWrong >= 3 || newCompetence <= 0) {
        return { 
          ...prev, 
          totalWrong: newTotalWrong, 
          status: GameStatus.WASTED, 
          competenceScore: 0,
          consecutiveWrong: newConsecutiveWrong,
        };
      }

      // Check for round completion
      if (prev.currentQuestionIndex >= 9) {
        // Check for perfect score
        if (newTotalCorrect === 10) {
          return {
            ...prev,
            status: GameStatus.IPO,
            totalCorrect: newTotalCorrect,
            totalWrong: newTotalWrong,
            competenceScore: 100,
          };
        }
        return { 
          ...prev, 
          status: GameStatus.RESULTS, 
          totalCorrect: newTotalCorrect,
          totalWrong: newTotalWrong,
          competenceScore: newCompetence,
        };
      }

      return {
        ...prev,
        competenceScore: newCompetence,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        totalCorrect: newTotalCorrect,
        totalWrong: newTotalWrong,
        consecutiveWrong: newConsecutiveWrong,
      };
    });
  }, [currentQuestion, spawnParticles]);

  // Fetch CMO brief on results
  const fetchBrief = useCallback(async () => {
    if (!gameState.currentSessionId) return;
    setIsBriefLoading(true);
    const session = SESSIONS.find(s => s.id === gameState.currentSessionId);
    const brief = await generateCMOBrief(gameState.totalCorrect, session?.title || "Marketing Strategy");
    setGameState(prev => ({ ...prev, lastBrief: brief }));
    setIsBriefLoading(false);
  }, [gameState.currentSessionId, gameState.totalCorrect]);

  useEffect(() => {
    if (gameState.status === GameStatus.RESULTS) {
      fetchBrief();
    }
  }, [gameState.status, fetchBrief]);

  // Return to lobby
  const returnToLobby = useCallback(() => {
    const passed = gameState.totalCorrect >= 7;
    setGameState(prev => ({
      ...prev,
      status: GameStatus.LOBBY,
      sessionProgress: {
        ...prev.sessionProgress,
        [prev.currentSessionId!]: Math.min(3, (prev.sessionProgress[prev.currentSessionId!] || 0) + (passed ? 1 : 0))
      },
      lastBrief: null,
      showInsight: null,
    }));
  }, [gameState.totalCorrect]);

  // Competence Meter Component
  const CompetenceMeter: React.FC = () => {
    const isLow = gameState.competenceScore < 30;
    const isCritical = gameState.competenceScore < 15;
    
    return (
      <div className={`w-full bg-black/90 border-b-2 border-[#FDB515]/30 py-3 md:py-4 px-4 md:px-6 shrink-0 z-50 ${isCritical ? 'danger-pulse' : ''}`}>
        <div className="w-full max-w-5xl mx-auto">
          {/* Labels */}
          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
              <span className="text-red-500 font-black text-[8px] md:text-[10px] uppercase tracking-widest">Incompetence</span>
              <span className={`text-red-600 font-black text-xs md:text-lg haas-font italic leading-none ${isLow ? 'animate-pulse' : ''}`}>INFERNO</span>
            </div>
            
            {/* Strike Counter */}
            <div className="text-center flex flex-col items-center">
              <span className="text-white/50 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Strikes</span>
              <div className="flex gap-1 md:gap-2">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-5 h-5 md:w-7 md:h-7 border-2 border-red-500 flex items-center justify-center font-black text-xs md:text-sm
                      ${i < gameState.totalWrong ? 'bg-red-500 text-white shadow-[0_0_10px_red]' : 'text-red-500/50'}`}
                  >
                    ✕
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-green-500 font-black text-[8px] md:text-[10px] uppercase tracking-widest">Competence</span>
              <span className="text-green-500 font-black text-xs md:text-lg haas-font italic leading-none">NIRVANA</span>
            </div>
          </div>
          
          {/* Meter Bar */}
          <div className="relative h-4 md:h-6 bg-black/50 border border-white/20 overflow-hidden">
            <div className="absolute inset-0 meter-gradient opacity-30" />
            <div 
              className="absolute top-0 left-0 h-full bg-white/90 transition-all duration-500 ease-out"
              style={{ width: `${gameState.competenceScore}%` }}
            />
            {/* Needle indicator */}
            <div 
              className="absolute top-0 h-full w-1 bg-[#FDB515] shadow-[0_0_10px_#FDB515] transition-all duration-500"
              style={{ left: `${gameState.competenceScore}%` }}
            />
          </div>
          
          {/* Score display */}
          <div className="flex justify-between mt-1">
            <span className="text-white/40 text-[10px] md:text-xs font-black">Q{gameState.currentQuestionIndex + 1}/10</span>
            <span className={`text-[10px] md:text-xs font-black ${gameState.competenceScore > 50 ? 'text-green-400' : 'text-red-400'}`}>
              {gameState.totalCorrect} CORRECT
            </span>
          </div>
        </div>
      </div>
    );
  };

  // WASTED Screen
  if (gameState.status === GameStatus.WASTED) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[500] wasted-screen p-4 md:p-10">
        <div className="text-center space-y-4 md:space-y-8">
          <h1 className="text-5xl md:text-8xl lg:text-[12rem] font-black text-red-600 italic haas-font uppercase leading-none tracking-tighter drop-shadow-2xl wasted-glitch">
            WASTED
          </h1>
          <p className="text-white text-sm md:text-xl lg:text-2xl uppercase tracking-[0.1em] md:tracking-[0.2em] font-black opacity-80 max-w-xl mx-auto">
            3 STRIKES. YOUR CAREER HAS BEEN STRATEGICALLY LIQUIDATED.
          </p>
          <p className="text-red-400/60 text-xs md:text-sm italic max-w-md mx-auto">
            "The Value Wedge doesn't reward the incompetent."
          </p>
          <button 
            onClick={returnToLobby} 
            className="bg-red-600 hover:bg-red-500 text-white px-8 md:px-12 py-4 md:py-6 font-black uppercase text-sm md:text-xl tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl border-2 border-red-400"
          >
            EXIT IN SHAME
          </button>
        </div>
      </div>
    );
  }

  // IPO Screen (Perfect Score)
  if (gameState.status === GameStatus.IPO) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#003262] via-blue-900 to-[#003262] flex flex-col items-center justify-center z-[600] ipo-screen p-4">
        {/* Money rain effect */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="money-particle text-2xl md:text-4xl"
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            {['💰', '💵', '💎', '🏆'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
        
        <div className="text-center space-y-4 md:space-y-6 relative z-10">
          <div className="text-6xl md:text-8xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-7xl lg:text-9xl font-black text-[#FDB515] haas-font uppercase leading-none drop-shadow-2xl glow-text">
            YOU IPO'D
          </h1>
          <h2 className="text-lg md:text-2xl font-black text-white/90 uppercase tracking-[0.3em] md:tracking-[0.5em]">
            STRATEGIC ASCENSION COMPLETE
          </h2>
          <p className="text-white/60 text-sm md:text-lg max-w-md mx-auto">
            10/10. Perfect execution. The board has approved your golden parachute.
          </p>
          <button 
            onClick={returnToLobby} 
            className="mt-6 md:mt-8 bg-[#FDB515] hover:bg-yellow-400 text-[#003262] px-8 md:px-12 py-4 md:py-6 font-black uppercase text-sm md:text-xl tracking-widest hover:scale-110 active:scale-95 transition-all shadow-2xl"
          >
            RETIRE TO NAPA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col relative bg-[#003262] text-white overflow-hidden">
      {/* Particles */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle text-3xl md:text-5xl" 
          style={{ left: `${p.x}%`, animationDelay: `${p.delay}s` }}
        >
          {p.char}
        </div>
      ))}

      {/* Competence Meter - only during gameplay */}
      {gameState.status === GameStatus.PLAYING && <CompetenceMeter />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden z-10">
        
        {/* LOBBY */}
        {gameState.status === GameStatus.LOBBY && (
          <div className="h-full w-full max-w-7xl flex flex-col justify-between py-4 md:py-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-8 mb-4 md:mb-0">
              {/* Title */}
              <div className="flex-1 space-y-2 md:space-y-4 text-center md:text-left">
                <div className="inline-block border-2 border-[#FDB515] text-[#FDB515] px-3 md:px-4 py-1 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] animate-pulse">
                  STRATEGIC AUDIT DEPOT
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-none text-[#FDB515] haas-font uppercase tracking-tighter">
                  HOPELAIN'S<br/>HUMBUG
                </h1>
                <p className="text-sm md:text-lg lg:text-xl text-white/70 max-w-xl leading-tight font-medium">
                  Prove you aren't just an expensive PowerPoint generator. 
                  <span className="text-[#FDB515] font-black"> 7/10 to pass. 3 strikes = fail. NO MERCY.</span>
                </p>
              </div>
              
              {/* Halo */}
              <div className="shrink-0 hidden md:block">
                <Halo size="lg" />
              </div>
              <div className="shrink-0 md:hidden">
                <Halo size="sm" />
              </div>
            </div>

            {/* Session Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 flex-1 max-h-[50vh] md:max-h-[45vh] overflow-auto">
              {SESSIONS.map(session => {
                const progress = gameState.sessionProgress[session.id] || 0;
                const isComplete = progress >= 3;
                
                return (
                  <div 
                    key={session.id} 
                    className={`session-card bg-white/5 border border-white/10 p-2 md:p-3 flex flex-col justify-between group overflow-hidden ${isComplete ? 'opacity-60' : ''}`}
                  >
                    {/* Progress dots */}
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className={`h-1 md:h-1.5 flex-1 transition-all duration-300 ${
                            i <= progress 
                              ? 'bg-[#FDB515] shadow-[0_0_5px_#FDB515]' 
                              : 'bg-white/10'
                          }`} 
                        />
                      ))}
                    </div>
                    
                    {/* Session info */}
                    <div className="flex-1 min-h-0">
                      <div className="text-[#FDB515]/60 text-[10px] font-black mb-1">SESSION {session.id}</div>
                      <h3 className="text-xs md:text-sm font-black uppercase tracking-tight leading-tight mb-1 group-hover:text-[#FDB515] transition-colors line-clamp-2">
                        {session.title}
                      </h3>
                      <p className="text-[8px] md:text-[9px] text-white/40 font-bold uppercase tracking-wider leading-tight line-clamp-2 hidden md:block">
                        {session.description}
                      </p>
                    </div>
                    
                    {/* Play button */}
                    <button 
                      onClick={() => startSession(session.id, progress + 1)}
                      disabled={isComplete}
                      className="w-full py-2 md:py-2.5 mt-2 btn-gold text-[#003262] font-black text-[10px] md:text-xs uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      {isComplete ? '✓ DONE' : `BANK ${progress + 1}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {gameState.status === GameStatus.PLAYING && currentQuestion && (
          <div className="h-full w-full max-w-5xl flex flex-col justify-between py-2 md:py-4">
            {/* Header */}
            <div className="flex justify-between items-center px-2 md:px-4 mb-2 md:mb-4">
              <div className="text-[#FDB515] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em]">
                SESSION {gameState.currentSessionId}.{gameState.currentBankId}
              </div>
              <button 
                onClick={returnToLobby} 
                className="text-white/40 hover:text-red-500 text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/10 hover:border-red-500 px-2 md:px-3 py-1 transition-all"
              >
                ABORT
              </button>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center px-2 md:px-6 py-2 md:py-4">
              <h3 className="text-lg md:text-2xl lg:text-4xl font-black text-white text-center leading-tight drop-shadow-xl max-w-4xl">
                {currentQuestion.text}
              </h3>
            </div>

            {/* Insight display */}
            {gameState.showInsight && (
              <div className="absolute inset-x-4 md:inset-x-10 top-1/2 -translate-y-1/2 bg-black/95 border-2 border-[#FDB515] p-4 md:p-6 z-40">
                <div className="text-[#FDB515] text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">STRATEGIC INSIGHT</div>
                <p className="text-white text-sm md:text-lg italic">"{gameState.showInsight}"</p>
              </div>
            )}

            {/* Answer Choices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 px-2 md:px-0">
              {currentQuestion.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={!!overlay || !!gameState.showInsight}
                  className="answer-btn group relative flex items-center p-3 md:p-4 bg-white/5 border-2 border-white/10 text-left font-bold text-sm md:text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-2 md:mr-4 text-white/20 group-hover:text-[#003262]/30 font-black text-xl md:text-3xl italic shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-tight">{choice}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {gameState.status === GameStatus.RESULTS && (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-4 md:space-y-6 py-4 md:py-6 max-w-5xl px-4">
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-[#FDB515] haas-font uppercase italic leading-none">
              VERDICT
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full items-stretch">
              {/* Score Card */}
              <div className="flex-1 p-4 md:p-6 bg-white/5 border-2 border-white/20 flex flex-col items-center justify-center">
                <h4 className="text-[10px] md:text-xs uppercase tracking-[0.5em] md:tracking-[1em] text-[#FDB515] font-black mb-2 md:mb-4">ACCURACY</h4>
                <div className="text-5xl md:text-7xl lg:text-8xl font-black leading-none">
                  {gameState.totalCorrect}
                  <span className="text-lg md:text-2xl text-white/20">/10</span>
                </div>
                <div className={`mt-4 md:mt-6 px-4 md:px-6 py-2 font-black text-sm md:text-lg uppercase tracking-widest border-2 ${
                  gameState.totalCorrect >= 7 
                    ? 'border-green-500 text-green-500' 
                    : 'border-red-500 text-red-500'
                }`}>
                  {gameState.totalCorrect >= 7 ? '✓ CLEARANCE' : '✕ FAILED'}
                </div>
              </div>

              {/* CMO Brief */}
              <div className="flex-[1.5] bg-black/40 p-4 md:p-6 border-2 border-[#FDB515]/30 flex flex-col justify-center">
                <h5 className="haas-font text-lg md:text-2xl font-black text-[#FDB515] uppercase italic mb-2 md:mb-4">
                  The Private Brief
                </h5>
                <div className="italic text-sm md:text-lg leading-relaxed text-white/90 border-l-4 border-[#FDB515] pl-4 md:pl-6">
                  {isBriefLoading ? (
                    <span className="loading-dots">Analyzing your strategic competence</span>
                  ) : (
                    `"${gameState.lastBrief}"`
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={returnToLobby} 
              className="px-8 md:px-10 py-3 md:py-4 btn-gold text-[#003262] font-black uppercase tracking-widest text-sm md:text-xl"
            >
              EXIT TO LOBBY
            </button>
          </div>
        )}
      </main>

      {/* Overlay for reactions */}
      {overlay && (
        <div className={`fixed inset-0 flex flex-col items-center justify-center z-[450] pointer-events-none ${overlay.bg} transition-all duration-300`}>
          <div className={`flex flex-col items-center ${overlay.effect} text-center px-4`}>
            <span className="text-6xl md:text-8xl lg:text-[10rem] mb-2 md:mb-4">{overlay.emoji}</span>
            <h1 className={`${overlay.textColor} text-3xl md:text-5xl lg:text-7xl font-black uppercase drop-shadow-2xl haas-font italic leading-none`}>
              {overlay.text}
            </h1>
            <p className={`${overlay.textColor} text-sm md:text-xl uppercase tracking-widest mt-2 opacity-80 font-bold`}>
              {overlay.subtext}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
