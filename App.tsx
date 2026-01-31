import React, { useState, useRef } from 'react';
import { StoryType, Tense } from './types';
import { GeminiService } from './services/geminiService';

const JapanLogo = () => (
  <div className="w-24 h-24 flex-shrink-0 drop-shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Sun Disk */}
      <circle cx="50" cy="50" r="45" fill="#CD5C5C" />
      {/* Torii Gate Silhouette */}
      <rect x="25" y="32" width="50" height="4" rx="1" fill="white" />
      <path d="M20 25C35 20 65 20 80 25L78 30C65 26 35 26 22 30L20 25Z" fill="white" />
      <rect x="34" y="30" width="5" height="50" fill="white" />
      <rect x="61" y="30" width="5" height="50" fill="white" />
      <rect x="30" y="42" width="40" height="3" fill="white" />
    </svg>
  </div>
);

const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'review' | 'discovery'>('review');

  // Tab 1: Review State
  const [inputText, setInputText] = useState('');
  const [listeA, setListeA] = useState('');
  const [storyType, setStoryType] = useState<StoryType>(StoryType.MODERN);
  const [tense, setTense] = useState<Tense>(Tense.PRESENT);
  const [generatedText, setGeneratedText] = useState('');
  const [listeB, setListeB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Tab 2: Discovery State
  const [kanjiRef, setKanjiRef] = useState('');
  const [numWords, setNumWords] = useState('10');
  const [listeC, setListeC] = useState('');
  const [loadingC, setLoadingC] = useState(false);
  
  const geminiRef = useRef(new GeminiService());

  // Utilitaires de validation
  const hasKanji = (text: string) => /\p{Script=Han}/u.test(text);
  const hasAlphanumeric = (text: string) => /[a-zA-Z0-9]/.test(text);

  // --- Handlers Tab 1 ---
  const handleExtractA = async () => {
    if (!inputText.trim()) return;
    if (!hasKanji(inputText)) return;

    setLoadingA(true);
    setListeA('');
    try {
      const result = await geminiRef.current.extractWords(inputText);
      setListeA(result);
    } catch (error) {
      console.error("Error extracting A:", error);
    } finally {
      setLoadingA(false);
    }
  };

  const handleProcessStoryAndB = async () => {
    if (!listeA.trim()) return;
    setLoadingStory(true);
    setGeneratedText('');
    setListeB('');
    
    try {
      const story = await geminiRef.current.generateStory(listeA, storyType, tense);
      setGeneratedText(story);
      setLoadingStory(false);
      
      setLoadingB(true);
      const extractedB = await geminiRef.current.extractWords(story);
      setListeB(extractedB);
    } catch (error) {
      console.error("Error in generation flow:", error);
    } finally {
      setLoadingStory(false);
      setLoadingB(false);
    }
  };

  // --- Handlers Tab 2 ---
  const handleExtractC = async () => {
    if (!kanjiRef.trim()) return;
    if (!hasKanji(kanjiRef) || hasAlphanumeric(kanjiRef)) return;

    setLoadingC(true);
    setListeC('');
    try {
      const result = await geminiRef.current.getCommonWords(kanjiRef, numWords);
      setListeC(result);
    } catch (error) {
      console.error("Error extracting C:", error);
    } finally {
      setLoadingC(false);
    }
  };

  const handleReset = () => {
    if (activeTab === 'review') {
      setInputText('');
      setListeA('');
      setGeneratedText('');
      setListeB('');
    } else {
      setKanjiRef('');
      setNumWords('10');
      setListeC('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative font-kaisei text-black flex flex-col items-center">
      {/* Header with Title and Logo */}
      <header className="w-full max-w-5xl px-6 pt-10 flex flex-col items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center">
          <JapanLogo />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            れんぐ先生と日本語を勉強しましょう!
          </h1>
        </div>

        {/* External Links Navigation */}
        <nav className="flex flex-wrap justify-center gap-4 py-4 w-full">
          <a href="https://www.dictionnaire-japonais.com/index.php" target="_blank" rel="noopener noreferrer" 
             className="px-5 py-2 bg-white border border-black hover:bg-black hover:text-white transition-colors rounded shadow-sm text-sm font-bold">
            辞書
          </a>
          <a href="https://kanjikana.com/fr" target="_blank" rel="noopener noreferrer" 
             className="px-5 py-2 bg-white border border-black hover:bg-black hover:text-white transition-colors rounded shadow-sm text-sm font-bold">
            漢字 JLPT
          </a>
          <a href="https://jpdb.io/kanken-kanji" target="_blank" rel="noopener noreferrer" 
             className="px-5 py-2 bg-white border border-black hover:bg-black hover:text-white transition-colors rounded shadow-sm text-sm font-bold">
            漢字Kanken
          </a>
          <a href="https://kanji123.org/" target="_blank" rel="noopener noreferrer" 
             className="px-5 py-2 bg-white border border-black hover:bg-black hover:text-white transition-colors rounded shadow-sm text-sm font-bold">
            漢字のテスト
          </a>
        </nav>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-black/10 rounded-lg border border-black/20">
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-10 py-3 rounded-md font-bold transition-all text-lg ${activeTab === 'review' ? 'bg-black text-white shadow-lg scale-105' : 'hover:bg-black/5'}`}
          >
            漢字を復習
          </button>
          <button 
            onClick={() => setActiveTab('discovery')}
            className={`px-10 py-3 rounded-md font-bold transition-all text-lg ${activeTab === 'discovery' ? 'bg-black text-white shadow-lg scale-105' : 'hover:bg-black/5'}`}
          >
            漢字を探す
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl px-4 py-8 flex flex-col gap-10">
        
        {/* TAB 1: REVIEW (漢字を復習) */}
        {activeTab === 'review' && (
          <div className="flex flex-col gap-10">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-md border-l-8 border-brownCustom">
              <p className="text-lg leading-relaxed">
                こんにちは！ れんぐ先生です. Je suis Rengu Sensei, professeur de Japonais. <strong>ようこそ !</strong><br />
                Mon objectif est de t’aider à réviser les mots que tu apprends. Partage le texte ou une liste de mots que tu révises. 
                Je vais t’écrire un nouveau texte pour que tu puisses t’entraîner à lire en japonais. 宜しくお願いします.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="font-bold text-xl flex items-center gap-2">
                <span className="bg-brownCustom text-white px-2 py-1 rounded text-sm">Texte de référence :</span> 
              </label>
              <textarea
                className="w-full bg-indianRed text-white p-5 rounded border border-brownCustom focus:outline-none focus:ring-2 focus:ring-black placeholder-white/60 text-lg shadow-inner"
                rows={10}
                placeholder="日本語での資料とか言葉..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleExtractA}
                  disabled={loadingA || !inputText || !hasKanji(inputText)}
                  className="px-12 py-4 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-30 text-xl shadow-lg uppercase tracking-widest"
                >
                  送る
                </button>
                {loadingA && <p className="animate-pulse font-bold text-brownCustom text-lg">Génération en cours...</p>}
              </div>
            </div>

            {listeA && (
              <div className="bg-white/80 p-6 rounded-lg shadow-lg border-2 border-black/5">
                <h3 className="font-bold text-2xl mb-4 border-b-2 border-brownCustom pb-2 font-kaisei">LISTE_A : Mots extraits</h3>
                <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-lg">
                  {listeA}
                </div>
              </div>
            )}

            {listeA && (
              <div className="flex flex-col md:flex-row gap-6 bg-white/70 p-8 rounded-xl border border-black/10 shadow-lg">
                <div className="flex-1 flex flex-col gap-3">
                  <label className="font-bold">物語のタイプ (Type d'histoire) :</label>
                  <select 
                    className="p-3 border-2 border-black rounded bg-white text-lg focus:ring-2 focus:ring-indianRed outline-none"
                    value={storyType}
                    onChange={(e) => setStoryType(e.target.value as StoryType)}
                  >
                    {Object.values(StoryType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <label className="font-bold">動詞の活用 (Conjugaison) :</label>
                  <select 
                    className="p-3 border-2 border-black rounded bg-white text-lg focus:ring-2 focus:ring-indianRed outline-none"
                    value={tense}
                    onChange={(e) => setTense(e.target.value as Tense)}
                  >
                    {Object.values(Tense).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleProcessStoryAndB}
                    disabled={loadingStory || loadingB}
                    className="w-full md:w-auto px-8 py-3 bg-brownCustom text-white font-bold hover:bg-black transition-all rounded shadow-md text-lg"
                  >
                    {loadingStory ? "Génération..." : "Générer l'histoire"}
                  </button>
                </div>
              </div>
            )}

            {generatedText && (
              <div className="bg-white/95 p-10 rounded-xl shadow-2xl border-t-8 border-black">
                <h3 className="font-bold text-3xl mb-8 text-center text-brownCustom">Nouveau texte</h3>
                <div 
                  className="text-2xl leading-[3.5rem] tracking-wider whitespace-pre-line text-justify" 
                  dangerouslySetInnerHTML={{ 
                    __html: generatedText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indianRed border-b-2 border-indianRed/30">$1</strong>') 
                  }} 
                />
                {loadingB && <p className="mt-8 text-center animate-pulse font-bold text-brownCustom">La liste B est en cours de génération...</p>}
              </div>
            )}

            {listeB && (
              <div className="bg-white/80 p-6 rounded-lg shadow-lg border-2 border-black/5">
                <h3 className="font-bold text-2xl mb-4 border-b-2 border-brownCustom pb-2 font-kaisei">LISTE_B : Mots à réviser</h3>
                <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-lg">
                  {listeB}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISCOVERY (漢字を探す) */}
        {activeTab === 'discovery' && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-md border-l-8 border-brownCustom">
              <p className="text-lg leading-relaxed">
                れんぐ先生 peut t’aider à lister les mots les plus couramment utilisé à partir d’un kanji pour que tu puisses facilement apprendre les mots contenant ce kanji. A toi de jouer, quel kanji cherches-tu ?
              </p>
            </div>

            <div className="flex flex-col gap-6 bg-white/60 p-10 rounded-2xl border-2 border-black/5 shadow-xl items-center md:items-start">
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <label className="font-bold text-xl">漢字を探す :</label>
                <input
                  type="text"
                  maxLength={10}
                  className="w-full md:w-[400px] h-[4rem] bg-indianRed text-white p-4 rounded border-2 border-brownCustom focus:outline-none focus:ring-4 focus:ring-black/20 text-center text-4xl shadow-inner font-bold placeholder:text-white/40"
                  placeholder="漢字"
                  value={kanjiRef}
                  onChange={(e) => setKanjiRef(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                <label className="font-bold text-xl">何言葉 (Nombre de mots) :</label>
                <select 
                  className="w-full md:w-[200px] p-4 border-2 border-black rounded bg-white text-xl font-bold focus:ring-4 focus:ring-indianRed/30 outline-none shadow-sm cursor-pointer"
                  value={numWords}
                  onChange={(e) => setNumWords(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>

              <div className="flex flex-col items-center gap-3 pt-6 w-full">
                <button
                  onClick={handleExtractC}
                  disabled={loadingC || !kanjiRef || !hasKanji(kanjiRef) || hasAlphanumeric(kanjiRef)}
                  className="px-16 py-5 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-30 text-2xl shadow-2xl uppercase tracking-[0.2em] rounded-sm"
                >
                  送る
                </button>
                {loadingC && <p className="animate-pulse font-bold text-brownCustom text-xl">Génération en cours...</p>}
              </div>
            </div>

            {listeC && (
              <div className="bg-white/95 p-10 rounded-xl shadow-2xl border-t-8 border-brownCustom border-x border-b border-black/10">
                <h3 className="font-bold text-2xl mb-8 border-b-2 border-brownCustom pb-4 font-kaisei text-brownCustom uppercase tracking-wider">
                  Mots courants avec {kanjiRef}
                </h3>
                <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-xl">
                  {listeC}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Reset Button */}
        <div className="flex justify-center mt-12 mb-20">
          <button
            onClick={handleReset}
            className="px-14 py-5 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all rounded shadow-2xl uppercase tracking-widest text-xl"
          >
            削除する
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-10 bg-black text-white text-center mt-auto border-t-4 border-brownCustom">
        <p className="font-bold text-xl tracking-tight">Créé par Géraldine PERY, France</p>
        <div className="mt-3">
          <a 
            href="https://www.linkedin.com/in/geraldine-pery/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-indianRed hover:underline transition-colors text-lg"
          >
            Linkedin
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;