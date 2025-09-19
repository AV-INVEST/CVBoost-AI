export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 prose">
      <h1>Termini di Servizio</h1>

      <h2>Definizioni</h2>
      <p>
        CVBoost.ai è un servizio online che fornisce strumenti per
        l’ottimizzazione del Curriculum Vitae al fine di migliorarne la
        compatibilità con sistemi ATS (Applicant Tracking Systems).
        L’utilizzo del servizio implica l’accettazione dei presenti Termini.
      </p>

      <h2>Servizi offerti</h2>
      <p>
        CVBoost.ai fornisce funzionalità di analisi, riscrittura e suggerimenti
        relativi al CV. Non viene in alcun modo garantita l’assunzione o il
        risultato occupazionale.
      </p>

      <h2>Prezzi e abbonamenti</h2>
      <p>
        Sono disponibili piani <strong>Free, Pro, Business e Business+</strong>.
        Gli abbonamenti a pagamento hanno rinnovo mensile automatico e possono
        essere annullati in qualsiasi momento dal Portale Cliente (Stripe). Non
        sono previsti rimborsi per i periodi già fatturati, salvo diversa
        disposizione di legge.
      </p>

      <h2>Uso consentito</h2>
      <p>
        L’utente si impegna a utilizzare il servizio in modo lecito e conforme
        alla normativa vigente. È vietato l’uso illecito, l’invio di contenuti
        protetti da diritto d’autore senza autorizzazione o qualsiasi attività
        che possa compromettere la sicurezza e la stabilità del servizio.
      </p>

      <h2>Proprietà intellettuale</h2>
      <p>
        Tutti i contenuti, i marchi e il software relativi a CVBoost.ai sono di
        proprietà del Titolare o concessi in licenza. Ne è vietata la
        riproduzione, distribuzione o modifica non autorizzata.
      </p>

      <h2>Limitazione di responsabilità</h2>
      <p>
        Il servizio è fornito <em>“as is”</em>. CVBoost.ai non garantisce
        l’assenza di errori, interruzioni o la compatibilità con ogni sistema
        ATS. Non siamo responsabili di perdite indirette, danni consequenziali o
        interruzioni del servizio.
      </p>

      <h2>Privacy e Cookie</h2>
      <p>
        Il trattamento dei dati personali avviene secondo la Privacy Policy e la
        Cookie Policy pubblicate sul sito, che l’utente è tenuto a consultare
        prima dell’utilizzo.
      </p>

      <h2>Modifiche ai Termini</h2>
      <p>
        CVBoost.ai si riserva il diritto di modificare i presenti Termini in
        qualsiasi momento. Le modifiche saranno pubblicate su questa pagina e
        diventeranno efficaci al momento della pubblicazione.
      </p>

      <h2>Legge applicabile e foro competente</h2>
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per ogni
        controversia relativa all’utilizzo del Servizio, sarà competente in via
        esclusiva il foro del luogo in cui ha sede il Titolare, salvo diversa
        disposizione di legge.
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
      </p>
    </main>
  );
}
