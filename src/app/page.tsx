import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <LogoMark size="lg" />
      <h1 className="text-5xl font-extrabold tracking-tight">Lashly</h1>
      <p className="max-w-[40ch] text-lg text-mute">Ton agenda de lash tech, pensé pour ton métier.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        <Link
          href="/inscription"
          className="rounded-btn border border-acc bg-acc px-[18px] py-[11px] font-semibold text-acc-ink no-underline"
        >
          Créer mon espace
        </Link>
        <Link
          href="/connexion"
          className="rounded-btn border border-line bg-surface px-[18px] py-[11px] font-semibold no-underline"
        >
          Me connecter
        </Link>
      </div>
    </main>
  );
}
