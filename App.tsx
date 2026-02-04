
import React, { useState, useRef, useEffect } from 'react';
import { StoryType, Tense, Language, KanjiDetails } from './types';
import { GeminiService } from './services/geminiService';
import { translations } from './translations';

const JapanLogo = () => (
  <div className="w-24 h-24 flex-shrink-0 drop-shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="#CD5C5C" />
      <rect x="25" y="32" width="50" height="4" rx="1" fill="white" />
      <path d="M20 25C35 20 65 20 80 25L78 30C65 26 35 26 22 30L20 25Z" fill="white" />
      <rect x="34" y="30" width="5" height="50" fill="white" />
      <rect x="61" y="30" width="5" height="50" fill="white" />
      <rect x="30" y="42" width="40" height="3" fill="white" />
    </svg>
  </div>
);

interface Point {
  x: number;
  y: number;
}

const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'review' | 'discovery' | 'writing'>('review');
  const [language, setLanguage] = useState<Language>(Language.FR);

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

  // Tab 3: Writing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [proposedKanjis, setProposedKanjis] = useState<string[]>([]);
  const [selectedKanjiDetails, setSelectedKanjiDetails] = useState<KanjiDetails | null>(null);
  const [loadingWriting, setLoadingWriting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const geminiRef = useRef(new GeminiService());

  // Translations
  const t = translations[language];

  // Utilities
  const hasKanji = (text: string) => /\p{Script=Han}/u.test(text);
  const hasAlphanumeric = (text: string) => /[a-zA-Z0-9]/.test(text);

  // --- Keyboard Event Listeners (Shift key) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Handlers Tab 1 ---
  const handleExtractA = async () => {
    if (!inputText.trim() || !hasKanji(inputText)) return;
    setLoadingA(true);
    setListeA('');
    try {
      const result = await geminiRef.current.extractWords(inputText, language);
      setListeA(result);
    } catch (error) { console.error("Error extracting A:", error); }
    finally { setLoadingA(false); }
  };

  const handleProcessStoryAndB = async () => {
    if (!listeA.trim()) return;
    setLoadingStory(true);
    setGeneratedText('');
    setListeB('');
    try {
      const story = await geminiRef.current.generateStory(listeA, storyType, tense, language);
      setGeneratedText(story);
      setLoadingStory(false);
      setLoadingB(true);
      const extractedB = await geminiRef.current.extractWords(story, language);
      setListeB(extractedB);
    } catch (error) { console.error("Error in generation flow:", error); }
    finally { setLoadingStory(false); setLoadingB(false); }
  };

  // --- Handlers Tab 2 ---
  const handleExtractC = async () => {
    if (!kanjiRef.trim() || !hasKanji(kanjiRef) || hasAlphanumeric(kanjiRef)) return;
    setLoadingC(true);
    setListeC('');
    try {
      const result = await geminiRef.current.getCommonWords(kanjiRef, numWords, language);
      setListeC(result);
    } catch (error) { console.error("Error extracting C:", error); }
    finally { setLoadingC(false); }
  };

  // --- Handlers Tab 3: Writing ---
  const getMousePos = (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { 
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    if (shiftPressed && strokes.length > 0) {
      const lastStroke = strokes[strokes.length - 1];
      const lastPoint = lastStroke[lastStroke.length - 1];
      const newStroke = [lastPoint, pos];
      setStrokes(prev => [...prev, newStroke]);
    } else {
      setIsDrawing(true);
      setStrokes(prev => [...prev, [pos]]);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    setStrokes(prev => {
      const newStrokes = [...prev];
      const currentStroke = [...newStrokes[newStrokes.length - 1]];
      currentStroke.push(pos);
      newStrokes[newStrokes.length - 1] = currentStroke;
      return newStrokes;
    });
  };

  const stopDrawing = () => setIsDrawing(false);

  // PERSISTENCE: redraw canvas whenever strokes change or tab switches back
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.length < 1) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  }, [strokes, activeTab]); 

  const handleUndo = () => setStrokes(prev => prev.slice(0, -1));

  const handleResetTab3 = () => {
    setStrokes([]);
    setProposedKanjis([]);
    setSelectedKanjiDetails(null);
  };

  const handleSendDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    
    setLoadingWriting(true);
    setProposedKanjis([]);
    setSelectedKanjiDetails(null);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const candidates = await geminiRef.current.recognizeKanji(dataUrl);
      setProposedKanjis(candidates);
      
      if (candidates.length > 0) {
        handleSelectKanji(candidates[0]);
      }
    } catch (error) { console.error("Recognition error:", error); }
    finally { setLoadingWriting(false); }
  };

  const handleSelectKanji = async (kanji: string) => {
    setLoadingDetails(true);
    setSelectedKanjiDetails(null);
    try {
      const details = await geminiRef.current.getKanjiDetails(kanji, language);
      setSelectedKanjiDetails(details);
    } catch (error) { console.error("Details error:", error); }
    finally { setLoadingDetails(false); }
  };

  const handleReset = () => {
    if (activeTab === 'review') {
      setInputText(''); setListeA(''); setGeneratedText(''); setListeB('');
    } else if (activeTab === 'discovery') {
      setKanjiRef(''); setNumWords('10'); setListeC('');
    } else {
      handleResetTab3();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative font-kaisei text-black flex flex-col items-center">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-white/80 backdrop-blur-sm border-2 border-black rounded-md px-3 py-1 font-bold shadow-md cursor-pointer hover:bg-white transition-colors text-sm md:text-base outline-none focus:ring-2 focus:ring-indianRed"
        >
          {Object.entries(translations).map(([code, data]) => (
            <option key={code} value={code}>{data.langName}</option>
          ))}
        </select>
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl px-6 pt-10 flex flex-col items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center">
          <JapanLogo />
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">れんぐ先生と日本語を勉強しましょう!</h1>
            <p className="text-xl md:text-2xl mt-2 font-medium text-indianRed">{t.title}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-black/10 rounded-lg border border-black/20 overflow-x-auto max-w-full">
          {[
            { id: 'review', label: t.tabs.review, sub: t.tabLabels.review, active: activeTab === 'review' },
            { id: 'discovery', label: t.tabs.search, sub: t.tabLabels.search, active: activeTab === 'discovery' },
            { id: 'writing', label: t.tabs.write, sub: t.tabLabels.write, active: activeTab === 'writing' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 md:px-24 py-3 rounded-md font-bold transition-all text-sm md:text-lg whitespace-nowrap ${tab.active ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5'}`}
            >
              <div className="flex flex-col">
                <span>{tab.label}</span>
                <span className="text-xs opacity-80 tracking-tighter">{tab.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </header>

      <main className="w-full max-w-4xl px-4 py-8 flex flex-col gap-10">
        {/* TAB 1: REVIEW */}
        <div className={activeTab === 'review' ? 'flex flex-col gap-6' : 'hidden'}>
          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-md border-l-8 border-brownCustom">
            <p className="text-lg leading-relaxed">{t.introReview}</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-lg text-black italic font-medium" dangerouslySetInnerHTML={{ __html: t.disclaimer }} />
          </div>
          <div className="flex flex-col gap-4">
            <textarea
              className="w-full bg-indianRed text-white p-5 rounded border border-brownCustom focus:outline-none focus:ring-2 focus:ring-black placeholder-white/60 text-lg shadow-inner"
              rows={10}
              placeholder={t.placeholderInput.replace(/<br\s*\/?>/gi, '\n')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleExtractA}
                disabled={loadingA || !inputText || !hasKanji(inputText)}
                className="px-12 py-3 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-30 text-xl shadow-lg tracking-widest leading-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: t.btnSend }} />
              </button>
              {loadingA && <p className="animate-pulse font-bold text-brownCustom text-lg text-center leading-tight mt-2" dangerouslySetInnerHTML={{ __html: t.generating }} />}
            </div>
          </div>
          {listeA && (
            <div className="bg-white/80 p-6 rounded-lg shadow-lg border-2 border-black/5">
              <h3 className="font-bold text-2xl mb-4 border-b-2 border-brownCustom pb-2 leading-tight" dangerouslySetInnerHTML={{ __html: t.extractedWords }} />
              <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-lg">{listeA}</div>
            </div>
          )}
          {listeA && (
            <div className="flex flex-col md:flex-row gap-6 bg-white/70 p-8 rounded-xl border border-black/10 shadow-lg items-end">
              <div className="flex-1 flex flex-col gap-3 w-full">
                <label className="font-bold leading-tight" dangerouslySetInnerHTML={{ __html: t.storyType }} />
                <select className="p-3 border-2 border-black rounded bg-white text-lg focus:ring-2 focus:ring-indianRed outline-none" value={storyType} onChange={(e) => setStoryType(e.target.value as StoryType)}>
                  {Object.values(StoryType).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-3 w-full">
                <label className="font-bold leading-tight" dangerouslySetInnerHTML={{ __html: t.tense }} />
                <select className="p-3 border-2 border-black rounded bg-white text-lg focus:ring-2 focus:ring-indianRed outline-none" value={tense} onChange={(e) => setTense(e.target.value as Tense)}>
                  {Object.values(Tense).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="w-full md:w-auto">
                <button onClick={handleProcessStoryAndB} disabled={loadingStory || loadingB} className="w-full px-8 py-3 bg-brownCustom text-white font-bold hover:bg-black transition-all rounded shadow-md text-lg leading-tight">
                  <span dangerouslySetInnerHTML={{ __html: loadingStory ? t.generating : t.btnGenerate }} />
                </button>
              </div>
            </div>
          )}
          {generatedText && (
            <div className="bg-white/95 p-10 rounded-xl shadow-2xl border-t-8 border-black">
              <h3 className="font-bold text-3xl mb-8 text-center text-brownCustom leading-tight" dangerouslySetInnerHTML={{ __html: t.newStory }} />
              <div className="text-2xl leading-[3.5rem] tracking-wider whitespace-pre-line text-justify" dangerouslySetInnerHTML={{ __html: generatedText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indianRed border-b-2 border-indianRed/30">$1</strong>') }} />
              {loadingB && <p className="mt-8 text-center animate-pulse font-bold text-brownCustom leading-tight" dangerouslySetInnerHTML={{ __html: t.generating }} />}
            </div>
          )}
          {listeB && (
            <div className="bg-white/80 p-6 rounded-lg shadow-lg border-2 border-black/5">
              <h3 className="font-bold text-2xl mb-4 border-b-2 border-brownCustom pb-2 leading-tight" dangerouslySetInnerHTML={{ __html: t.wordsToReview }} />
              <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-lg">{listeB}</div>
            </div>
          )}
        </div>

        {/* TAB 2: DISCOVERY */}
        <div className={activeTab === 'discovery' ? 'flex flex-col gap-6' : 'hidden'}>
          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-md border-l-8 border-brownCustom">
            <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t.introSearch }} />
          </div>
          
          <div className="px-4 text-center">
            <p className="text-lg text-black italic leading-tight font-medium" dangerouslySetInnerHTML={{ __html: t.disclaimer }} />
          </div>

          <div className="bg-white/60 p-10 rounded-2xl border-2 border-black/5 shadow-xl relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
              <div className="flex flex-col gap-3 flex-grow md:max-w-[300px]">
                <label className="font-bold text-xl leading-tight" dangerouslySetInnerHTML={{ __html: t.labelSearchKanji }} />
                <input type="text" maxLength={10} className="w-full h-[4rem] bg-indianRed text-white p-4 rounded border-2 border-brownCustom focus:outline-none focus:ring-4 focus:ring-black/20 text-center text-4xl shadow-inner font-bold placeholder:text-white/40" placeholder="漢字" value={kanjiRef} onChange={(e) => setKanjiRef(e.target.value)} />
              </div>
              <div className="flex flex-col gap-3 w-full md:w-[150px]">
                <label className="font-bold text-xl leading-tight" dangerouslySetInnerHTML={{ __html: t.labelNumWords }} />
                <input type="number" min="1" max="50" className="w-full h-[4rem] p-4 border-2 border-black rounded bg-white text-xl font-bold focus:ring-4 focus:ring-indianRed/30 outline-none shadow-sm" value={numWords} onChange={(e) => setNumWords(e.target.value)} />
              </div>
              <div className="flex flex-col items-center gap-2 flex-shrink-0 w-full md:w-auto">
                <button onClick={handleExtractC} disabled={loadingC || !kanjiRef || !hasKanji(kanjiRef)} className="w-full md:w-auto h-[4rem] px-12 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-30 text-2xl shadow-lg tracking-wider rounded-sm flex items-center justify-center">
                  <span dangerouslySetInnerHTML={{ __html: t.btnSend }} />
                </button>
              </div>
            </div>
            {loadingC && <p className="mt-6 animate-pulse font-bold text-brownCustom text-xl leading-tight text-center" dangerouslySetInnerHTML={{ __html: t.generating }} />}
          </div>
          {listeC && (
            <div className="bg-white/95 p-10 rounded-xl shadow-2xl border-t-8 border-brownCustom border-x border-b border-black/10">
              <h3 className="font-bold text-2xl mb-8 border-b-2 border-brownCustom pb-4 text-brownCustom tracking-wider leading-tight">
                <span dangerouslySetInnerHTML={{ __html: t.commonWordsWith }} /> {kanjiRef}
              </h3>
              <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-xl">{listeC}</div>
            </div>
          )}
        </div>

        {/* TAB 3: WRITING */}
        <div className={activeTab === 'writing' ? 'flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
          <div className="w-full">
            <p className="text-xs text-brownCustom mb-2 font-sans italic">{t.writingInstruction}</p>
            <div className="flex flex-col md:flex-row gap-6 w-full items-stretch">
              <div className="flex-grow md:w-3/4 bg-white rounded-xl border-4 border-indianRed/30 shadow-xl overflow-hidden relative" style={{ height: '400px' }}>
                <canvas 
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair bg-white touch-none"
                />
              </div>

              <div className="flex flex-col gap-4 md:w-1/4">
                <button 
                  onClick={handleUndo}
                  className="w-full py-4 bg-indianRed/80 text-white border-2 border-indianRed font-bold rounded-lg hover:opacity-90 active:bg-black transition-colors shadow-sm text-sm"
                >
                  <span dangerouslySetInnerHTML={{ __html: t.btnUndo }} />
                </button>
                <button 
                  onClick={handleResetTab3}
                  className="w-full py-4 bg-gray-100 text-black border-2 border-gray-300 font-bold rounded-lg hover:bg-gray-400 active:bg-black active:text-white transition-colors shadow-sm text-sm"
                >
                  <span dangerouslySetInnerHTML={{ __html: t.btnReset }} />
                </button>
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={handleSendDrawing}
                    disabled={loadingWriting || strokes.length === 0}
                    className="w-full py-6 bg-black text-white border-2 border-black font-bold rounded-lg hover:bg-white hover:text-black active:bg-gray-800 transition-all shadow-lg text-lg disabled:opacity-50"
                  >
                    <span dangerouslySetInnerHTML={{ __html: loadingWriting ? t.generating : t.btnSend }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 text-center">
            <p className="text-lg text-black italic leading-tight font-medium" dangerouslySetInnerHTML={{ __html: t.disclaimer }} />
          </div>

          <div className="flex flex-col gap-8 w-full">
            {/* Details (Full width) */}
            <div className="w-full bg-white/60 p-8 rounded-xl border-2 border-indianRed/10 shadow-lg min-h-[400px]">
              <h3 className="font-bold text-xl mb-6 border-b-2 border-indianRed/20 pb-2 text-indianRed" dangerouslySetInnerHTML={{ __html: t.detailsTitle }} />
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 border-4 border-indianRed border-t-transparent rounded-full animate-spin"></div>
                  <p className="animate-pulse font-bold text-indianRed text-xl" dangerouslySetInnerHTML={{ __html: t.generating }} />
                </div>
              ) : selectedKanjiDetails ? (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                    <div className="flex flex-col items-center gap-4">
                       <div className="text-[3.5rem] font-bold text-black bg-white p-8 rounded-3xl shadow-inner border border-indianRed/10 leading-none select-all cursor-text" title="Click and drag to copy">
                          {selectedKanjiDetails.kanji}
                       </div>
                    </div>
                    <div className="flex flex-col gap-8 flex-grow w-full">
                      <div className="bg-white p-6 rounded-2xl border-2 border-indianRed/5 shadow-sm">
                        <div className="text-2xl text-indianRed/60 font-bold mb-1 uppercase tracking-widest">{t.onyomi}</div>
                        <div className="font-bold text-4xl text-black">{selectedKanjiDetails.onyomi}</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border-2 border-indianRed/5 shadow-sm">
                        <div className="text-2xl text-indianRed/60 font-bold mb-1 uppercase tracking-widest">{t.kunyomi}</div>
                        <div className="font-bold text-4xl text-black">{selectedKanjiDetails.kunyomi}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="font-bold text-2xl text-indianRed uppercase tracking-tight" dangerouslySetInnerHTML={{ __html: t.meaning }} />
                    <div className="bg-indianRed/10 p-6 rounded-3xl shadow-md border-2 border-brownCustom/10">
                       <p className="text-2xl font-bold text-brownCustom/80 leading-tight text-center">
                         {selectedKanjiDetails.meaning}
                       </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <a 
                      href={selectedKanjiDetails.jishoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-12 py-5 bg-indianRed/10 text-indianRed border-2 border-indianRed/30 rounded-2xl hover:bg-indianRed hover:text-white transition-all font-bold shadow-md hover:shadow-lg scale-100 hover:scale-105 text-xl"
                    >
                      {t.jishoMoreInfo} ↗
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Global Reset */}
        <div className="flex justify-center mt-12 mb-20">
          <button onClick={handleReset} className="px-14 py-4 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-all rounded shadow-2xl tracking-widest text-xl leading-tight">
            <span dangerouslySetInnerHTML={{ __html: t.btnReset }} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-10 bg-black text-white text-center mt-auto border-t-4 border-brownCustom">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8">
          {[
            { label: t.footerLinks.dict, url: "https://www.dictionnaire-japonais.com/index.php" },
            { label: t.footerLinks.jlpt, url: "https://kanjikana.com/fr" },
            { label: t.footerLinks.kanken, url: "https://jpdb.io/kanken-kanji" },
            { label: t.footerLinks.test, url: "https://kanji123.org/" }
          ].map((link, idx) => (
            <a 
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
            >
              <span 
                className="text-white hover:text-indianRed font-bold text-sm md:text-base leading-tight text-center group-hover:underline"
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            </a>
          ))}
        </div>
        <p className="text-sm opacity-70 mb-2">Powered by Gemini from Google AI Studio</p>
        <div className="flex flex-col gap-2">
           <p className="font-bold text-2xl tracking-tight">Created by Géraldine PERY, France</p>
           <a href="https://www.linkedin.com/in/geraldine-pery/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-indianRed hover:underline transition-colors text-lg">Linkedin</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
