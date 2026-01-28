import React, { useState, useEffect } from 'react';

const ExecutiveNotebook = () => {
  const [notebooks, setNotebooks] = useState(() => {
    const saved = localStorage.getItem('executive-docs');
    return saved ? JSON.parse(saved) : {};
  });

  const [activePagePath, setActivePagePath] = useState(null);
  const [activeNbId, setActiveNbId] = useState(null);
  const [activeSecId, setActiveSecId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Unified Input State
  const [inputTarget, setInputTarget] = useState({ type: null, id: null }); // type: 'nb', 'sec', 'pg'
  const [tempInput, setTempInput] = useState('');

  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem('executive-docs', JSON.stringify(notebooks));
    const timer = setTimeout(() => setIsSaving(false), 800);
    return () => clearTimeout(timer);
  }, [notebooks]);

  // --- LOGIC: CREATE ---
  const handleCreate = (e, type, parentNbId = null, parentSecId = null) => {
    if (e.key !== 'Enter' || !tempInput.trim()) return;

    const id = `ID_${Date.now()}`;
    const updated = { ...notebooks };

    if (type === 'nb') {
      updated[id] = { [tempInput]: { sections: {} } };
    } else if (type === 'sec') {
      const nbName = Object.keys(updated[parentNbId])[0];
      updated[parentNbId][nbName].sections[id] = { sectionname: tempInput, pages: {} };
    } else if (type === 'pg') {
      const nbName = Object.keys(updated[parentNbId])[0];
      updated[parentNbId][nbName].sections[parentSecId].pages[id] = { pagename: tempInput, content: "" };
      setActivePagePath({ nbId: parentNbId, secId: parentSecId, pgId: id });
    }

    setNotebooks(updated);
    setTempInput('');
    setInputTarget({ type: null, id: null });
  };

  // --- LOGIC: DELETE ---
  const handleDelete = (e, type, nbId, secId = null, pgId = null) => {
    e.stopPropagation();
    const updated = { ...notebooks };
    if (type === 'nb') delete updated[nbId];
    else if (type === 'sec') delete updated[nbId][Object.keys(updated[nbId])[0]].sections[secId];
    else if (type === 'pg') delete updated[nbId][Object.keys(updated[nbId])[0]].sections[secId].pages[pgId];
    
    setNotebooks(updated);
    if (activePagePath?.pgId === pgId) setActivePagePath(null);
  };

  const updateContent = (val) => {
    if (!activePagePath) return;
    const { nbId, secId, pgId } = activePagePath;
    const updated = { ...notebooks };
    const nbName = Object.keys(updated[nbId])[0];
    updated[nbId][nbName].sections[secId].pages[pgId].content = val;
    setNotebooks(updated);
  };

  const currentPage = activePagePath 
    ? notebooks[activePagePath.nbId]?.[Object.keys(notebooks[activePagePath.nbId])[0]]?.sections[activePagePath.secId]?.pages[activePagePath.pgId] 
    : null;

  return (
    <div className="flex h-screen w-full bg-white text-[#1a1a1a] font-['Plus_Jakarta_Sans'] antialiased p-6 gap-6">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-[#f9f9f9] border border-[#f1f1f1] rounded-[32px] flex flex-col shrink-0 overflow-hidden shadow-sm">
        <div className="p-8">
          <span className="text-[10px] font-extrabold text-[#a1a1aa] uppercase tracking-[0.2em] mb-4 block">Architecture</span>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Dossier</h2>
            <button 
              onClick={() => setInputTarget({ type: 'nb', id: 'root' })}
              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10 custom-scrollbar">
          {/* Create Notebook Input */}
          {inputTarget.type === 'nb' && (
            <input 
              autoFocus
              className="w-full bg-white border-2 border-black rounded-xl p-3 text-xs font-bold outline-none"
              placeholder="NEW NOTEBOOK..."
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              onKeyDown={(e) => handleCreate(e, 'nb')}
              onBlur={() => setInputTarget({ type: null, id: null })}
            />
          )}

          {Object.entries(notebooks).map(([nbId, nbData]) => {
            const nbName = Object.keys(nbData)[0];
            const isNbOpen = activeNbId === nbId;

            return (
              <div key={nbId} className="group/nb">
                <div 
                  onClick={() => setActiveNbId(isNbOpen ? null : nbId)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${isNbOpen ? 'bg-white border border-[#f1f1f1] shadow-sm' : 'hover:bg-white/60'}`}
                >
                  <span className="text-xs font-black uppercase">{nbName}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveNbId(nbId); setInputTarget({ type: 'sec', id: nbId }); }}
                      className="opacity-0 group-hover/nb:opacity-100 text-[9px] font-bold bg-black text-white px-2 py-1 rounded-md"
                    >
                      + SEC
                    </button>
                    <button onClick={(e) => handleDelete(e, 'nb', nbId)} className="opacity-0 group-hover/nb:opacity-40 hover:!opacity-100">✕</button>
                  </div>
                </div>

                {isNbOpen && (
                  <div className="ml-4 pl-4 border-l-2 border-[#f1f1f1] mt-2 space-y-4">
                    {/* Create Section Input */}
                    {inputTarget.type === 'sec' && inputTarget.id === nbId && (
                      <input 
                        autoFocus
                        className="w-full bg-white border border-black/20 rounded-lg p-2 text-[10px] font-bold outline-none"
                        placeholder="SECTION NAME..."
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        onKeyDown={(e) => handleCreate(e, 'sec', nbId)}
                        onBlur={() => setInputTarget({ type: null, id: null })}
                      />
                    )}

                    {Object.entries(nbData[nbName].sections).map(([secId, secData]) => (
                      <div key={secId} className="group/sec space-y-2">
                        <div className="flex justify-between items-center">
                          <span 
                            onClick={() => setActiveSecId(activeSecId === secId ? null : secId)}
                            className={`text-[10px] font-extrabold uppercase tracking-widest cursor-pointer ${activeSecId === secId ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                          >
                            # {secData.sectionname}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setActiveSecId(secId); setInputTarget({ type: 'pg', id: secId }); }}
                              className="opacity-0 group-hover/sec:opacity-100 text-[8px] font-bold border border-black px-1.5 py-0.5 rounded"
                            >
                              + PG
                            </button>
                            <button onClick={(e) => handleDelete(e, 'sec', nbId, secId)} className="opacity-0 group-hover/sec:opacity-40 text-[8px]">✕</button>
                          </div>
                        </div>
                        
                        {activeSecId === secId && (
                          <div className="ml-2 space-y-1">
                            {/* Create Page Input */}
                            {inputTarget.type === 'pg' && inputTarget.id === secId && (
                              <input 
                                autoFocus
                                className="w-full bg-white border border-black/10 rounded-lg p-2 text-[10px] outline-none mb-2"
                                placeholder="PAGE NAME..."
                                value={tempInput}
                                onChange={(e) => setTempInput(e.target.value)}
                                onKeyDown={(e) => handleCreate(e, 'pg', nbId, secId)}
                                onBlur={() => setInputTarget({ type: null, id: null })}
                              />
                            )}
                            {Object.entries(secData.pages).map(([pgId, pgData]) => (
                              <div 
                                key={pgId}
                                onClick={() => setActivePagePath({ nbId, secId, pgId })}
                                className={`group/pg p-3 rounded-xl text-[11px] font-semibold cursor-pointer transition-all flex justify-between items-center ${activePagePath?.pgId === pgId ? 'bg-black text-white shadow-md' : 'bg-white/40 hover:bg-white text-gray-500 hover:text-black'}`}
                              >
                                <span>{pgData.pagename}</span>
                                <button onClick={(e) => handleDelete(e, 'pg', nbId, secId, pgId)} className="opacity-0 group-hover/pg:opacity-50 text-[10px]">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className="flex-grow bg-[#f9f9f9] border border-[#f1f1f1] rounded-[32px] flex flex-col min-w-0 transition-all overflow-hidden">
        {currentPage ? (
          <>
            <div className="h-24 flex items-center justify-between px-10 border-b border-[#f1f1f1] bg-[#f9f9f9]">
              <div>
                <span className="text-[10px] font-extrabold text-[#a1a1aa] uppercase tracking-widest">Active dossier</span>
                <h1 className="text-3xl font-black tracking-tighter uppercase">{currentPage.pagename}</h1>
              </div>
              <div className="flex items-center gap-4">
                {isSaving && <div className="text-[9px] font-black text-green-500 uppercase">Saving...</div>}
                <button 
                  onClick={() => setIsPreview(!isPreview)}
                  className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-extrabold uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            <div className="flex-1 m-4 rounded-[24px] bg-white border border-[#f1f1f1] overflow-hidden flex flex-col">
              {isPreview ? (
                <div className="p-16 overflow-auto custom-scrollbar">
                  <h1 className="text-5xl font-black tracking-tighter uppercase mb-10 border-b-[6px] border-black pb-4">{currentPage.pagename}</h1>
                  <div className="text-xl font-medium leading-relaxed text-gray-700 whitespace-pre-wrap">{currentPage.content || "NO DATA."}</div>
                </div>
              ) : (
                <textarea 
                  className="w-full h-full p-12 outline-none resize-none text-2xl font-medium text-black placeholder:text-gray-100"
                  value={currentPage.content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Initiate acquisition..."
                />
              )}
            </div>
          </>
        ) : (
          <div className="m-auto text-center opacity-10 select-none">
             <h1 className="text-[10rem] font-black tracking-tighter leading-none">VOID.</h1>
             <p className="text-xs font-extrabold uppercase tracking-[0.4em]">Awaiting Selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveNotebook;