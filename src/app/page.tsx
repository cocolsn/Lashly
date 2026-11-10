export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-card bg-acc text-2xl font-semibold text-acc-ink"
      >
        L
      </span>
      <h1 className="text-5xl font-extrabold tracking-tight">Lashly</h1>
      <p className="max-w-[40ch] text-lg text-mute">
        Ton agenda de lash tech, pensé pour ton métier. Bientôt disponible.
      </p>
    </main>
  );
}
