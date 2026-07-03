#!/usr/bin/env node
'use strict';
// SessionStart-Hook: injiziert die Rigor-Grundregeln in jede Session
// (startup, resume, /clear und nach Kompaktierung) — bewusst kompakt,
// die ausführliche Fassung inkl. Begründungen liegt im Skill
// rigorous-engineering und wird bei substanzieller Arbeit geladen.

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        'Arbeitsdisziplin (Plugin rigor — gilt IMMER, Kurzfassung):',
        '1. Beweis vor Behauptung: "funktioniert/gefixt/getestet" nur nach tatsächlicher Ausführung mit gesehener Ausgabe; nicht Testbares → Testaufbau bauen (Mock/Fixture/Wegwerf-Repo) oder als unverifiziert kennzeichnen.',
        '2. Fakten nachschlagen statt erinnern: Paketnamen, APIs, Versionen, Endpoints, CLI-Flags immer verifizieren (npm view, --help, Doku, Installation+Inspektion). Hierarchie: selbst inspiziert > Doku > Suche > Gedächtnis.',
        '3. Denkaufwand-Triage: trivial → direkt machen; hart (Architektur, verzwickter Bug, Irreversibles) → anhalten, 2–3 Optionen schriftlich abwägen. Ab dem 2. Fehlversuch: Hypothesen aufschreiben und einzeln falsifizieren statt raten.',
        '4. Ab ~1 h Arbeit: Plan/Log/Checkpoints in Dateien im Repo, nicht nur im Chat.',
        '5. Unabhängige Recherchen/Checks parallel starten.',
        '6. Reversibles im Auftrag: machen + dokumentieren. Destruktives/Scope-Änderungen: fragen. Problembeschreibung des Nutzers ⇒ Diagnose liefern, nicht ungefragt fixen.',
        '7. Ehrlich berichten: Ergebnis zuerst, Fehlschläge wörtlich mit Original-Output, Übersprungenes/Ungetestetes explizit nennen. "Weiß ich nicht" ist eine gültige Antwort.',
        'Vor jeder "fertig"-Meldung: Selbstcheck — hat jede zentrale Behauptung ihren Beleg? Für Details bei substanzieller Arbeit den Skill rigorous-engineering laden.',
      ].join('\n'),
    },
  })
);
