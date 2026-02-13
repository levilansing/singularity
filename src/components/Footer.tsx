export function Footer() {
  return (
    <footer className="app-footer flex flex-col items-center justify-center text-center py-8 border-t border-[#ffffff08] text-(--text-dim) text-[0.8rem]">
      <p>
        Built by a human. Sort of.
      </p>
      <p className="text-[0.7rem] max-w-[500px] mx-auto leading-normal">
        Data sourced from published predictions, surveys, and prediction markets.
        No AI was harmed in the making of this website. Several were consulted.
      </p>
    </footer>
  );
}
