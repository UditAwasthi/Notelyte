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

export default App;