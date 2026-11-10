import Link from "next/link";

export default function StudioNotFound() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Studio introuvable</h1>
      <p className="mt-2 text-mute">Vérifie l’adresse : elle a peut-être changé ou contient une faute de frappe.</p>
      <Link href="/" className="mt-6 inline-block font-semibold">
        Aller sur Lashly
      </Link>
    </main>
  );
}
