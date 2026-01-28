
import {createRoot} from  'react-dom/client';
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PageView from "./components/PageView";

function App() {
  const [activePage, setActivePage] = useState({
    id: 1,
    title: "Page 1",
    content: "",
  });

  return (
    <div className="flex h-screen bg-neutral-950 text-white">
      <Sidebar onSelectPage={setActivePage} />
      <PageView page={activePage} />
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);