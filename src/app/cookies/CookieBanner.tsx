"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
    // 👉 qui puoi avviare Google Analytics o Meta Pixel
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setShowBanner(false);
    // 👉 qui NON avvii script di tracciamento
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg">
      <p className="mb-2 md:mb-0">
        Questo sito utilizza cookie tecnici e, previo consenso, cookie di terze
        parti (es. Analytics/Pixel). Puoi gestire la scelta qui.
      </p>
      <div className="flex gap-2">
        <button
          onClick={rejectCookies}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
        >
          Rifiuta
        </button>
        <button
          onClick={acceptCookies}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Accetta
        </button>
      </div>
    </div>
  );
}
