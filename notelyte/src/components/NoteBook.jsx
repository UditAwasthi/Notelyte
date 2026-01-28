import React, { useState, useEffect } from 'react';

const ExecutiveNotebook = () => {
  const [notebooks, setNotebooks] = useState(() => {
    const saved = localStorage.getItem('executive-docs');
    return saved ? JSON.parse(saved) : {};
  });

  // Independent expansion states using Sets
  const [openNotebooks, setOpenNotebooks] = useState(new Set());
  const [openSections, setOpenSections] = useState(new Set());
  
  const [activePagePath, setActivePagePath] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); 
  const [inputTarget, setInputTarget] = useState({ type: null, id: null, mode: 'create', parentNbId: null, parentSecId: null });
  const [tempInput, setTempInput] = useState('');
  const [clipboard, setClipboard] = useState(null);

  useEffect(() => {
    localStorage.setItem('executive-docs', JSON.stringify(notebooks));
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [notebooks]);

  // --- TOGGLE LOGIC ---
  const toggleNotebook = (id) => {
    const next = new Set(openNotebooks);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpenNotebooks(next);
  };

  const toggleSection = (id) => {
    const next = new Set(openSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpenSections(next);
  };

  // --- CRUD ENGINE ---
  const handleInputSubmit = (e) => {
    if (e.key !== 'Enter' || !tempInput.trim()) return;
    const { type, mode, id, parentNbId, parentSecId } = inputTarget;
    const updated = { ...notebooks };

    if (mode === 'create') {
      const newId = `ID_${Date.now()}`;
      if (type === 'nb') {
        updated[newId] = { [tempInput]: { sections: {} } };
        toggleNotebook(newId);
      } else if (type === 'sec') {
        const nbKey = Object.keys(updated[parentNbId])[0];
        updated[parentNbId][nbKey].sections[newId] = { sectionname: tempInput, pages: {} };
        toggleSection(newId);
      } else if (type === 'pg') {
        const nbKey = Object.keys(updated[parentNbId])[0];
        updated[parentNbId][nbKey].sections[parentSecId].pages[newId] = { pagename: tempInput, content: "" };
        setActivePagePath({ nbId: parentNbId, secId: parentSecId, pgId: newId });
      }
    } else {
      // Rename Logic
      if (type === 'nb') {
        const nbKey = Object.keys(updated[id])[0];
        const data = updated[id][nbKey];
        delete updated[id];
        updated[id] = { [tempInput]: data };
      } else if (type === 'sec') {
        const nbKey = Object.keys(updated[parentNbId])[0];
        updated[parentNbId][nbKey].sections[id].sectionname = tempInput;
      } else if (type === 'pg') {
        const nbKey = Object.keys(updated[parentNbId])[0];
        updated[parentNbId][nbKey].sections[parentSecId].pages[id].pagename = tempInput;
      }
    }
    setNotebooks(updated);
    setInputTarget({ type: null, id: null });
    setTempInput('');
  };

  const executeDelete = (target) => {
    const updated = { ...notebooks };
    const { type, id, parentNbId, parentSecId } = target;
    if (type === 'nb') delete updated[id];
    else if (type === 'sec') {
      const nbKey = Object.keys(updated[parentNbId])[0];
      delete updated[parentNbId][nbKey].sections[id];
    } else if (type === 'pg') {
      const nbKey = Object.keys(updated[parentNbId])[0];
      delete updated[parentNbId][nbKey].sections[parentSecId].pages[id];
    }
    if (activePagePath?.pgId === id) setActivePagePath(null);
    setNotebooks(updated);
  };
const handleCopy = (menu) => {
  const updated = { ...notebooks };

  if (menu.type === "sec") {
    const nbKey = Object.keys(updated[menu.parentNbId])[0];
    const section = updated[menu.parentNbId][nbKey].sections[menu.id];

    setClipboard({
      type: "sec",
      payload: JSON.parse(JSON.stringify(section)),
    });
  }

  if (menu.type === "pg") {
    const nbKey = Object.keys(updated[menu.parentNbId])[0];
    const page =
      updated[menu.parentNbId][nbKey].sections[menu.parentSecId].pages[menu.id];

    setClipboard({
      type: "pg",
      payload: JSON.parse(JSON.stringify(page)),
    });
  }
};

const handlePaste = (menu) => {
  if (!clipboard) return;

  const updated = { ...notebooks };
  const newId = `COPY_${Date.now()}`;

  // Paste SECTION → NOTEBOOK
  if (clipboard.type === "sec" && menu.type === "nb") {
    const nbKey = Object.keys(updated[menu.id])[0];

    updated[menu.id][nbKey].sections[newId] = {
      ...clipboard.payload,
      sectionname: clipboard.payload.sectionname + " (Copy)",
    };

    setNotebooks(updated);
    toggleNotebook(menu.id);
    return;
  }

  // Paste PAGE → SECTION
  if (clipboard.type === "pg" && menu.type === "sec") {
    const nbKey = Object.keys(updated[menu.parentNbId])[0];

    updated[menu.parentNbId][nbKey].sections[menu.id].pages[newId] = {
      ...clipboard.payload,
      pagename: clipboard.payload.pagename + " (Copy)",
    };

    setNotebooks(updated);
    toggleSection(menu.id);
    return;
  }
};


  const onDrop = (e, target) => {
    e.preventDefault();
    const item = JSON.parse(e.dataTransfer.getData("item"));
    if (item.id === target.id) return;
    const updated = { ...notebooks };
    if (item.type === 'pg' && target.type === 'sec') {
      const srcNbKey = Object.keys(updated[item.parentNbId])[0];
      const tarNbKey = Object.keys(updated[target.parentNbId])[0];
      const pageData = updated[item.parentNbId][srcNbKey].sections[item.parentSecId].pages[item.id];
      delete updated[item.parentNbId][srcNbKey].sections[item.parentSecId].pages[item.id];
      updated[target.parentNbId][tarNbKey].sections[target.id].pages[item.id] = pageData;
      setNotebooks(updated);
    }
  };

  const currentPage = activePagePath 
    ? notebooks[activePagePath.nbId]?.[Object.keys(notebooks[activePagePath.nbId])[0]]?.sections[activePagePath.secId]?.pages[activePagePath.pgId] 
    : null;

  return (
    <div className="flex h-screen w-full bg-[#fcfcfc] text-[#1a1a1a] font-['Plus_Jakarta_Sans'] p-6 gap-6">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-white border border-[#ececec] rounded-[32px] flex flex-col shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b bg-gray-50/20">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Dossier OS</h2>
          <button onClick={() => setInputTarget({ type: 'nb', id: 'root', mode: 'create' })} className="w-8 h-8 bg-black text-white rounded-full font-bold shadow-lg hover:scale-110 transition-transform">+</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {inputTarget.type === 'nb' && inputTarget.mode === 'create' && (
            <input autoFocus className="w-full p-3 border-2 border-black rounded-xl text-xs font-bold outline-none" placeholder="NOTEBOOK NAME..." value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
          )}

          {Object.entries(notebooks).map(([nbId, nbData]) => {
            const nbName = Object.keys(nbData)[0];
            const isEditingNb = inputTarget.id === nbId && inputTarget.mode === 'rename';
            const isNbOpen = openNotebooks.has(nbId);

            return (
              <div key={nbId} className="group">
                <div 
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, type: 'nb', id: nbId }); }}
                  onClick={() => toggleNotebook(nbId)}
                  className={`p-4 rounded-2xl cursor-pointer flex justify-between items-center transition-all ${isNbOpen ? 'bg-[#f8f8f8] ring-1 ring-black/5' : 'hover:bg-gray-50'}`}
                >
                  {isEditingNb ? (
                    <input autoFocus className="bg-transparent font-bold uppercase text-xs outline-none w-full" value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
                  ) : (
                    <span className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                       <span className={`transition-transform duration-200 ${isNbOpen ? 'rotate-90' : ''}`}>▶</span> {nbName}
                    </span>
                  )}
                </div>

                {isNbOpen && (
                  <div className="ml-5 pl-3 border-l-2 border-gray-100 mt-1 space-y-2">
                    {inputTarget.type === 'sec' && inputTarget.parentNbId === nbId && inputTarget.mode === 'create' && (
                      <input autoFocus className="w-full p-2 border border-black rounded-lg text-[10px] font-bold" placeholder="SECTION..." value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
                    )}

                    {Object.entries(nbData[nbName].sections).map(([secId, secData]) => {
                      const isEditingSec = inputTarget.id === secId && inputTarget.mode === 'rename';
                      const isSecOpen = openSections.has(secId);
                      return (
                        <div key={secId} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, { type: 'sec', id: secId, parentNbId: nbId })}>
                          <div 
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, type: 'sec', id: secId, parentNbId: nbId }); }}
                            onClick={() => toggleSection(secId)}
                            className={`text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-black mb-1 p-2 rounded-lg transition-colors ${isSecOpen ? 'text-black bg-gray-50' : 'text-gray-400'}`}
                          >
                            {isEditingSec ? (
                               <input autoFocus className="bg-transparent border-b border-black outline-none w-full" value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
                            ) : `# ${secData.sectionname}`}
                          </div>

                          {isSecOpen && (
                            <div className="space-y-1 ml-2">
                              {inputTarget.type === 'pg' && inputTarget.parentSecId === secId && inputTarget.mode === 'create' && (
                                <input autoFocus className="w-full p-2 border border-gray-200 rounded text-[10px]" placeholder="PAGE NAME..." value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
                              )}
                              {Object.entries(secData.pages).map(([pgId, pgData]) => {
                                const isEditingPg = inputTarget.id === pgId && inputTarget.mode === 'rename';
                                return (
                                  <div 
                                    key={pgId} draggable onDragStart={e => e.dataTransfer.setData("item", JSON.stringify({ type: 'pg', id: pgId, parentNbId: nbId, parentSecId: secId }))}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, type: 'pg', id: pgId, parentNbId: nbId, parentSecId: secId }); }}
                                    onClick={() => setActivePagePath({ nbId, secId, pgId })}
                                    className={`p-3 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${activePagePath?.pgId === pgId ? 'bg-black text-white shadow-md scale-[1.02]' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
                                  >
                                    {isEditingPg ? (
                                      <input autoFocus className="bg-transparent outline-none w-full text-white" value={tempInput} onChange={e => setTempInput(e.target.value)} onKeyDown={handleInputSubmit} />
                                    ) : pgData.pagename}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 bg-white border border-[#ececec] rounded-[40px] shadow-inner flex flex-col overflow-hidden">
        {currentPage ? (
          <>
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/30">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">{currentPage.pagename}</h1>
              <button onClick={() => setIsPreview(!isPreview)} className="px-8 py-3 bg-black text-white rounded-full text-xs font-bold uppercase hover:invert transition-all">{isPreview ? 'Edit' : 'Preview'}</button>
            </div>
            <div className="flex-1 p-2">
              {isPreview ? (
                <div className="p-12 text-xl font-medium leading-relaxed whitespace-pre-wrap">{currentPage.content || "VOID."}</div>
              ) : (
                <textarea 
                  className="w-full h-full p-12 outline-none resize-none text-2xl font-medium bg-transparent" 
                  value={currentPage.content} 
                  onChange={e => {
                    const updated = { ...notebooks };
                    updated[activePagePath.nbId][Object.keys(updated[activePagePath.nbId])[0]].sections[activePagePath.secId].pages[activePagePath.pgId].content = e.target.value;
                    setNotebooks(updated);
                  }}
                  placeholder="Capture intelligence..."
                />
              )}
            </div>
          </>
        ) : (
          <div className="m-auto text-center opacity-[0.05] pointer-events-none select-none">
            <h1 className="text-[12rem] font-black italic">OS</h1>
          </div>
        )}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="fixed bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 w-56 z-50 text-[11px] font-black uppercase tracking-widest overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="px-5 py-2 hover:bg-black hover:text-white cursor-pointer" onClick={() => { setInputTarget({ type: contextMenu.type === 'nb' ? 'sec' : 'pg', id: contextMenu.id, mode: 'create', parentNbId: contextMenu.type === 'nb' ? contextMenu.id : contextMenu.parentNbId, parentSecId: contextMenu.id }); setTempInput(''); }}>Add Child</div>
          <div className="px-5 py-2 hover:bg-black hover:text-white cursor-pointer" onClick={() => { setInputTarget({ ...contextMenu, mode: 'rename' }); setTempInput(''); }}>Rename</div>
          <div className="px-5 py-2 border-t mt-2 hover:bg-black hover:text-white cursor-pointer" onClick={() => handleCopy(contextMenu)}>Copy</div>
          <div className="px-5 py-2 hover:bg-black hover:text-white cursor-pointer" onClick={() => handlePaste(contextMenu)}>Paste</div>
          <div className="px-5 py-2 border-t mt-2 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer" onClick={() => executeDelete(contextMenu)}>Delete</div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveNotebook;