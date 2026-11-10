import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-[440px] px-4 py-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-xl font-extrabold no-underline">
        <LogoMark />
        Lashly
      </Link>
      <div className="rounded-card border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,23,38,.05)]">
        {children}
      </div>
    </main>
  );
}
