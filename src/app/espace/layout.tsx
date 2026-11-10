import type { Metadata } from "next";
import { LogoMark } from "@/components/logo-mark";
import { signOut } from "./actions";
import { Tabs } from "./tabs";

export const metadata: Metadata = { title: "Mon espace pro · Lashly" };

export default function EspaceLayout({ children }: LayoutProps<"/espace">) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pt-5 pb-12">
      <header className="mt-1.5 mb-1.5 flex items-center gap-3">
        <LogoMark />
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">Mon espace pro</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer rounded-btn border border-line bg-surface px-3.5 py-2 text-sm font-semibold"
          >
            Me déconnecter
          </button>
        </form>
      </header>
      <p className="mb-5 text-mute">Configure ton studio et tes prestations.</p>
      <Tabs />
      {children}
    </main>
  );
}
