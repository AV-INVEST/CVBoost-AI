import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Solo testo, senza Privacy/Cookies/Termini qui */}
        <p>© {new Date().getFullYear()} CVBoost.ai — Ottimizzatore CV per ATS</p>

        <nav className="flex items-center gap-3">
          <Link href="/" className="hover:underline">Homepage</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link href="/cookies" className="hover:underline">Cookies</Link>
          <span>·</span>
          <Link href="/termini" className="hover:underline">Termini</Link>
          <span>·</span>
          <Link href="/impostazioni/privacy" className="hover:underline">
            Gestione dati
          </Link>
        </nav>
      </div>
    </footer>
  );
}
