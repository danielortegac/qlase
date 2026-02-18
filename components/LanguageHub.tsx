
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LANGUAGE_TRACKS } from '../constants';
import { Star, Lock, Check, Trophy, Globe, Sparkles, ChevronDown, BookOpen, Wifi, WifiOff, ArrowRight, Languages } from 'lucide-react';
import { generateLanguageExercise, translateWithContext } from '../services/geminiService';

interface LanguageHubProps {
  user: User;
  onSubscribe: () => void;
}

const LanguageHub: React.FC<LanguageHubProps> = ({ user, onSubscribe }) => {
  const [viewMode, setViewMode] = useState<'learn' | 'translate'>('learn');
  const [currentTrackId, setCurrentTrackId] = useState<'english' | 'french'>('english');
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState<{text: string, source: 'ai' | 'offline'} | null>(null);
  const [loadingEx, setLoadingEx] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Translator State
  const [transInput, setTransInput] = useState('');
  const [transResult, setTransResult] = useState<{translation: string, explanation: string} | null>(null);
  const [loadingTrans, setLoadingTrans] = useState(false);

  const currentTrack = LANGUAGE_TRACKS.find(t => t.id === currentTrackId) || LANGUAGE_TRACKS[0];

  const handleLevelClick = async (levelId: number, isLocked: boolean, topic: string) => {
    if (isLocked) return;
    setActiveLevel(levelId);
    setLoadingEx(true);
    setExerciseData(null);
    try {
      const minTime = new Promise(resolve => setTimeout(resolve, 800));
      const dataPromise = generateLanguageExercise(topic, currentTrackId);
      const [_, data] = await Promise.all([minTime, dataPromise]);
      setExerciseData(data);
    } catch (e) {
       setExerciseData({ text: "Error loading content.||Try again.", source: 'offline' });
    } finally {
      setLoadingEx(false);
    }
  };

  const handleTranslate = async () => {
      if(!transInput.trim()) return;
      setLoadingTrans(true);
      const target = currentTrackId === 'english' ? 'Inglés' : 'Francés';
      const result = await translateWithContext(transInput, target);
      setTransResult(result);
      setLoadingTrans(false);
  };

  const getParts = (text: string) => {
      const parts = text.split('||');
      return {
          content: parts[0] || "Contenido no disponible.",
          answer: parts[1] ? parts[1].trim() : ""
      };
  };

  const parsedExercise = exerciseData ? getParts(exerciseData.text) : { content: "", answer: "" };

  return (
    <div className="h-full flex flex-col bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden relative animate-in fade-in duration-500 shadow-2xl pb-20 md:pb-0">
      
      {/* Language Switcher Header */}
      <div className="bg-zinc-950/95 backdrop-blur-xl p-4 md:p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center sticky top-0 z-30 gap-4">
        
        <div className="flex items-center gap-4 w-full md:w-auto">
             {/* Mode Toggles */}
             <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button onClick={() => setViewMode('learn')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'learn' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                    <BookOpen className="w-5 h-5"/>
                </button>
                <button onClick={() => setViewMode('translate')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'translate' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                    <Languages className="w-5 h-5"/>
                </button>
             </div>

            {/* Language Selector */}
            <div className="relative z-40 flex-1 md:flex-none">
                <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="w-full md:w-auto flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 px-4 py-2.5 rounded-xl transition-all group"
                >
                    <span className="text-xl">{currentTrack.flag}</span>
                    <div className="text-left mr-4 hidden md:block">
                        <p className="text-white font-bold text-xs group-hover:text-emerald-400 transition-colors">{currentTrack.name}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ml-auto md:ml-0 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                    <div className="absolute top-full left-0 w-full md:w-64 mt-2 bg-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        {LANGUAGE_TRACKS.map(track => (
                            <button
                                key={track.id}
                                onClick={() => {
                                    setCurrentTrackId(track.id);
                                    setIsLangMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900 transition-colors border-b border-zinc-900 last:border-0"
                            >
                                <span className="text-xl">{track.flag}</span>
                                <div className="text-left">
                                    <p className="text-white font-bold text-sm">{track.name}</p>
                                </div>
                                {currentTrackId === track.id && <Check className="w-4 h-4 text-emerald-500 ml-auto"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
             <div className="flex items-center gap-2">
                 {navigator.onLine ? (
                     <span className="flex items-center gap-2 text-[10px] text-blue-400 font-mono"><Globe className="w-3 h-3 animate-pulse"/> AI ONLINE</span>
                 ) : (
                     <span className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono"><WifiOff className="w-3 h-3"/> OFFLINE</span>
                 )}
             </div>
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${user.premiumLanguage ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-400 border-amber-500/30' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                <Trophy className={`w-3 h-3 ${user.premiumLanguage ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span className="">{user.premiumLanguage ? 'PRO' : 'FREE'}</span>
            </div>
        </div>
      </div>

      {/* VIEW: LEARN PATH */}
      {viewMode === 'learn' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-12 relative bg-black custom-scrollbar">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black pointer-events-none"></div>
            <div className="relative w-full max-w-5xl mx-auto">
                <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">Ruta de Aprendizaje</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {currentTrack.levels.map((level) => {
                        const isActive = !level.locked && level.stars < level.totalStars;
                        const isCompleted = level.stars === level.totalStars;
                        return (
                            <button
                                key={level.id}
                                onClick={() => handleLevelClick(level.id, level.locked, level.topic)}
                                className={`relative flex flex-col items-center p-6 rounded-3xl border transition-all duration-300 group ${level.locked ? 'bg-zinc-900/50 border-zinc-800 cursor-not-allowed opacity-70' : isCompleted ? 'bg-zinc-900 border-amber-900/30 hover:border-amber-500/50' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 hover:-translate-y-1 shadow-lg'}`}
                            >
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 relative ${level.locked ? 'bg-zinc-950 text-zinc-600' : isCompleted ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg shadow-amber-500/20' : currentTrackId === 'english' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
                                    {level.locked ? <Lock className="w-6 h-6" /> : isCompleted ? <Check className="w-8 h-8 stroke-[3]" /> : <Star className="w-8 h-8 fill-white/20" />}
                                    {!level.locked && (
                                        <div className="absolute -top-2 -right-2 flex bg-black/90 px-1.5 py-0.5 rounded-full border border-zinc-800">
                                            {[...Array(3)].map((_, i) => (<Star key={i} className={`w-2.5 h-2.5 ${i < level.stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />))}
                                        </div>
                                    )}
                                </div>
                                <h4 className={`text-xs md:text-sm font-bold text-center leading-tight mb-1 ${level.locked ? 'text-zinc-600' : 'text-white'}`}>{level.title}</h4>
                                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider text-center">{level.topic}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* VIEW: SMART TRANSLATOR */}
      {viewMode === 'translate' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-black relative">
              <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Traductor Contextual Inteligente</h2>
                      <p className="text-zinc-400 text-sm">La IA analizará la gramática y el tono (formal/informal) de tu traducción.</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                      {/* Input */}
                      <div className="mb-6">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Texto en Español</label>
                          <textarea 
                            value={transInput}
                            onChange={(e) => setTransInput(e.target.value)}
                            placeholder="Escribe algo aquí..."
                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-lg resize-none h-32 focus:outline-none focus:border-zinc-600 transition-colors"
                          />
                      </div>

                      <div className="flex justify-center -my-10 relative z-10">
                          <button 
                            onClick={handleTranslate}
                            disabled={loadingTrans || !transInput}
                            className="bg-white text-black p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform disabled:opacity-50"
                          >
                              {loadingTrans ? <Sparkles className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                          </button>
                      </div>

                      {/* Output */}
                      <div className="mt-6 pt-10">
                          <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                              {currentTrack.name} <Sparkles className="w-3 h-3"/>
                          </label>
                          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 min-h-[120px]">
                              {loadingTrans ? (
                                  <div className="space-y-2 animate-pulse">
                                      <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                                      <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                                  </div>
                              ) : transResult ? (
                                  <div className="animate-in fade-in">
                                      <p className="text-2xl font-serif text-white mb-4">{transResult.translation}</p>
                                      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Contexto IA</p>
                                          <p className="text-zinc-300 text-sm italic">{transResult.explanation}</p>
                                      </div>
                                  </div>
                              ) : (
                                  <p className="text-zinc-600 italic text-sm">La traducción aparecerá aquí...</p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Exercise Modal (Same as before) */}
      {activeLevel && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl relative shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Lección • Nivel {activeLevel}</span>
                    {exerciseData?.source === 'offline' && (<span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">OFFLINE</span>)}
                </div>
                <button onClick={() => setActiveLevel(null)} className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-all"><span className="sr-only">Cerrar</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {loadingEx ? (
                    <div className="flex flex-col items-center py-12 gap-6">
                        <Sparkles className="w-12 h-12 text-blue-400 animate-spin-slow" />
                        <p className="text-white font-bold animate-pulse">Generando Lección Personalizada...</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-inner">
                            <div className="flex gap-4">
                                <div className="p-2 bg-black rounded-lg h-fit border border-zinc-800"><BookOpen className="w-5 h-5 text-blue-400"/></div>
                                <div className="text-base text-zinc-200 leading-relaxed font-medium">{parsedExercise.content.split('\n').map((line, i) => (<p key={i} className="mb-2 last:mb-0">{line}</p>))}</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full p-4 border border-zinc-800 bg-black rounded-xl hover:bg-zinc-900 hover:border-zinc-600 transition-all text-zinc-300 font-medium text-left active:scale-[0.98] flex items-center gap-4 group text-sm">
                                <span className="w-6 h-6 rounded-full border border-zinc-700 flex-shrink-0 flex items-center justify-center text-zinc-500 text-xs font-bold group-hover:border-blue-500 group-hover:text-blue-500">A</span>
                                {parsedExercise.answer.split(' ').slice(0,3).join(' ')}... (Opción distractora)
                            </button>
                             <button className="w-full p-4 border border-zinc-800 bg-black rounded-xl hover:bg-zinc-900 hover:border-zinc-600 transition-all text-zinc-300 font-medium text-left active:scale-[0.98] flex items-center gap-4 group text-sm">
                                <span className="w-6 h-6 rounded-full border border-zinc-700 flex-shrink-0 flex items-center justify-center text-zinc-500 text-xs font-bold group-hover:border-blue-500 group-hover:text-blue-500">B</span>
                                {parsedExercise.answer}
                            </button>
                        </div>
                        <button onClick={() => setActiveLevel(null)} className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-lg uppercase tracking-wider text-xs mt-2">Completar Lección</button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageHub;
