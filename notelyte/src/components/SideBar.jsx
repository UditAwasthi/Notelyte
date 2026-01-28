import { useState } from "react";

function Sidebar() {
  const [openNotebook, setOpenNotebook] = useState(true);
  const [openSection, setOpenSection] = useState(true);

  return (
    <aside className="w-64 h-screen bg-neutral-900 text-neutral-200 p-4 text-sm">
      <h2 className="text-lg font-semibold mb-4">Notelyte</h2>

      {/* Notebook */}
      <div>
        <button
          onClick={() => setOpenNotebook(!openNotebook)}
          className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-neutral-800"
        >
          <span>{openNotebook ? "▾" : "▸"}</span>
          <span className="font-medium">Notebook</span>
        </button>

        {openNotebook && (
          <div className="ml-4 mt-1">
            {/* Section */}
            <button
              onClick={() => setOpenSection(!openSection)}
              className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-neutral-800"
            >
              <span>{openSection ? "▾" : "▸"}</span>
              <span>Section</span>
            </button>

            {openSection && (
              <div className="ml-4 mt-1 space-y-1">
                {/* Pages */}
                <div className="px-2 py-1 rounded hover:bg-neutral-800 cursor-pointer">
                  Page 1
                </div>
                <div className="px-2 py-1 rounded hover:bg-neutral-800 cursor-pointer">
                  Page 2
                </div>
                <div className="px-2 py-1 rounded hover:bg-neutral-800 cursor-pointer">
                  Page 3
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
