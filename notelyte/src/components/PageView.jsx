import PageEditor from "./PageEditor";

function PageView({ page }) {
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Select or create a page
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-24 py-16">
      <input
        className="w-full bg-transparent text-4xl font-bold outline-none mb-8 placeholder-neutral-600"
        placeholder="Untitled"
        defaultValue={page.title}
      />

      <PageEditor />
    </div>
  );
}

export default PageView;
