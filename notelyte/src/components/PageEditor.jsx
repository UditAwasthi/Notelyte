function PageEditor() {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className="
        w-full
        min-h-[60vh]
        outline-none
        text-neutral-200
        leading-relaxed
        text-lg
        caret-white
        selection:bg-blue-600/40
      "
      placeholder="Start writing..."
      onInput={(e) => {
        // future: autosave hook
        // console.log(e.currentTarget.innerText);
      }}
    >
      <p></p>
    </div>
  );
}

export default PageEditor;
