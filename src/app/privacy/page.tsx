export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 prose">
      <h1>Privacy Policy</h1>

      <p className="text-sm text-gray-500">
        Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
      </p>

      <h2>Chi tratta i tuoi dati</h2>
      <p>
        Il Titolare del trattamento è il gestore di CVBoost.ai
        (di seguito, “Servizio”). Questa informativa descrive come raccogliamo e
        utilizziamo i dati personali quando usi il Servizio.
      </p>

      <h2>Tipologie di dati trattati</h2>
      <ul>
        <li>
          <strong>Dati di account</strong> (se previsti): nome, email, credenziali
          crittografate, impostazioni profilo.
        </li>
        <li>
          <strong>Dati di utilizzo</strong>: log tecnici, identificatori del
          dispositivo, pagine visitate, data/ora, indirizzo IP (trattato a fini
          di sicurezza e antifrode).
        </li>
        <li>
          <strong>Contenuti forniti</strong>: CV, lettere di presentazione e
          testi caricati per l’ottimizzazione ATS.
        </li>
        <li>
          <strong>Dati di pagamento</strong> (solo per piani a pagamento):
          gestiti da fornitori terzi (es. Stripe). Il Servizio non conserva i
          numeri completi di carta.
        </li>
        <li>
          <strong>Cookie</strong>: tecnici essenziali; eventuali cookie di
          terze parti (Analytics/Pixel) solo previo consenso. Vedi Cookie Policy.
        </li>
      </ul>

      <h2>Finalità e basi giuridiche</h2>
      <ul>
        <li>
          <strong>Erogazione del Servizio</strong> (art. 6.1.b GDPR): creare e
          gestire l’account, fornire funzionalità di analisi/riscrittura CV.
        </li>
        <li>
          <strong>Sicurezza e prevenzione abusi</strong> (art. 6.1.f legittimo
          interesse): logging tecnico, antifrode, tutela da attacchi.
        </li>
        <li>
          <strong>Fatturazione</strong> (art. 6.1.b/c): gestione pagamenti e
          adempimenti fiscali tramite fornitori terzi.
        </li>
        <li>
          <strong>Analisi statistiche/marketing</strong> (art. 6.1.a consenso):
          solo se accetti i cookie di terze parti.
        </li>
        <li>
          <strong>Comunicazioni di servizio</strong> (art. 6.1.b/f): notifiche su
          cambi piano, scadenze, modifiche tecniche.
        </li>
      </ul>

      <h2>Modalità del trattamento e conservazione</h2>
      <p>
        I dati sono trattati con misure tecniche e organizzative adeguate per
        garantirne sicurezza e riservatezza. Conserveremo i dati per il tempo
        necessario alle finalità indicate, e comunque:
      </p>
      <ul>
        <li>
          <strong>Account</strong>: fino alla chiusura dell’account e, se
          necessario, per ulteriori <em>12 mesi</em> per finalità di tutela giuridica.
        </li>
        <li>
          <strong>Log tecnici</strong>: tipicamente <em>90–180 giorni</em>, salvo
          necessità di sicurezza.
        </li>
        <li>
          <strong>Dati di fatturazione</strong>: secondo i termini di legge
          applicabili.
        </li>
      </ul>

      <h2>Destinatari e trasferimenti</h2>
      <p>
        Possiamo condividere dati con <strong>fornitori</strong> che erogano
        infrastruttura, pagamenti, analisi o supporto (es. hosting, Stripe,
        strumenti di ticketing). Tali soggetti agiscono come responsabili del
        trattamento ai sensi dell’art. 28 GDPR.
      </p>
      <p>
        Se i dati sono trasferiti fuori dallo Spazio Economico Europeo, adottiamo
        garanzie adeguate (es. Clausole Contrattuali Standard) ai sensi degli
        artt. 44–49 GDPR.
      </p>

      <h2>Diritti dell’interessato</h2>
      <p>
        Ai sensi degli artt. 15–22 GDPR, puoi esercitare i diritti di accesso,
        rettifica, cancellazione, limitazione, portabilità e opposizione. Puoi
        inoltre revocare il consenso in qualsiasi momento (senza pregiudicare i
        trattamenti già effettuati).
      </p>
      <p>
        Puoi esercitare questi diritti dalle funzioni disponibili nel Servizio
        (ad es. “Esporta dati”, “Elimina account”, “Preferenze cookie”). Se non
        disponibili, fai riferimento ai canali indicati nella documentazione del
        Portale/Help.
      </p>

      <h2>Minori</h2>
      <p>
        Il Servizio non è destinato a minori di 16 anni e non raccoglie
        consapevolmente dati di minori. Qualora venisse a conoscenza di tali
        dati, il Titolare provvederà a cancellarli.
      </p>

      <h2>Cookie</h2>
      <p>
        Per i cookie tecnici e, ove presente, per i cookie di terze parti soggetti
        a consenso, consulta la Cookie Policy. Le preferenze possono essere
        modificate in qualsiasi momento tramite il banner o le impostazioni del
        browser.
      </p>

      <h2>Sicurezza</h2>
      <p>
        Applichiamo misure di sicurezza come cifratura in transito, controlli di
        accesso e backup. Nessuna misura è però in grado di garantire
        sicurezza assoluta.
      </p>

      <h2>Modifiche alla presente informativa</h2>
      <p>
        Questa informativa può essere aggiornata per riflettere cambi normativi
        o evoluzioni del Servizio. Le modifiche saranno pubblicate su questa
        pagina e diventano efficaci al momento della pubblicazione.
      </p>
    </main>
  );
}
