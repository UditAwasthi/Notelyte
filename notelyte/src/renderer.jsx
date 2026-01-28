
import {createRoot} from  'react-dom/client';
import { useState } from "react";
import ExecutiveNotebook from "./components/NoteBook"; 

export default function App() {
  return (
    <div className="flex h-screen bg-[#1c1c1c] text-neutral-200">
      <ExecutiveNotebook />
    </div>
  );
}


const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);