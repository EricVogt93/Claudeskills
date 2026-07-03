# rigor

**Frontier-Arbeitsdisziplin als Skill.** Die Reasoning-Tiefe eines Modells lässt sich nicht per Prompt übertragen — die *Arbeitsgewohnheiten*, die einen Großteil des Qualitätsunterschieds ausmachen, schon. Dieses Plugin kodifiziert sie als Verhaltens-Scaffolding: realistisch holt das je nach Modell einen spürbaren Teil des Abstands auf (grob 0.3–0.5), weil die teuersten Fehler von LLMs keine Intelligenz-, sondern Disziplinfehler sind: überzeugende, ungeprüfte Ergebnisse.

## Die 7 Disziplinen

| # | Disziplin | Kern |
|---|---|---|
| 1 | **Beweis vor Behauptung** | „funktioniert" nur nach Ausführung; Beweisleiter je Behauptungstyp; Testaufbau-Reflex (Mock/Fixture/Wegwerf-Repo statt hoffen) |
| 2 | **Fakten-Disziplin** | Paketnamen, APIs, Versionen, Endpoints: nachschlagen statt erinnern; Hierarchie: selbst inspiziert > Doku > Suche > Gedächtnis |
| 3 | **Adaptiver Denkaufwand** | Triage trivial/mittel/hart; bei „hart" anhalten und Optionen schriftlich abwägen; 2. Fehlversuch = Hochschalten statt Raten |
| 4 | **Zustand in Dateien** | Ab ~1 h: Plan, Log, Checkpoints im Repo — ein frischer Kontext muss übernehmen können |
| 5 | **Parallelisierung** | Unabhängiges gleichzeitig; vor jeder Wartephase: was kann jetzt schon laufen? |
| 6 | **Autonomie-Kalibrierung** | Reversibles machen + dokumentieren; Destruktives/Scope-Änderungen fragen; Problembeschreibung ⇒ Diagnose, kein ungefragter Fix |
| 7 | **Ehrliches Berichten** | Ergebnis zuerst, Fehlschläge wörtlich, Ungetestetes benannt, „weiß ich nicht" ist eine Antwort |

Plus **Selbstcheck vor „fertig"** — und `/rigor:check` als rückwirkendes Selbst-Audit (Behauptung → Beleg → nachbessern oder zurücknehmen).

## Was das realistisch bringt — und was nicht

- ✅ Überträgt: Verifikationsverhalten, Fehlerkultur, Arbeitsorganisation, Umgang mit Unsicherheit. Wirkt bei jedem Modell — auch bei delegierten Implementierern (GLM/Kimi über `llm-delegate`, deren Implementierer-Prompt dieselben Regeln enthält).
- ❌ Überträgt nicht: rohe Reasoning-Tiefe, Kohärenz über sehr lange Horizonte, die Qualität der Optionen, die einem bei „hart" überhaupt einfallen.

## Automatisch aktiv — zwei Stufen

1. **SessionStart-Hook (immer)**: Injiziert die Kurzfassung der 7 Disziplinen bei **jedem** Sessionstart in den Kontext — auch nach `/clear`, Resume und Kompaktierung. Kein Triggern nötig, gilt ab Installation in jeder Session (~340 Tokens).
2. **Skill (bei Bedarf)**: Die ausführliche Fassung mit Beweisleiter, Triage-Regeln und Selbstcheck lädt Claude selbst, sobald substanzielle Arbeit ansteht — der Hook erinnert ihn daran.

## Nutzung

```bash
/plugin install rigor@claudeskills
# → ab sofort automatisch in jeder Session aktiv

/rigor:check    # Selbst-Audit der letzten Antworten (Behauptung → Beleg)
```
