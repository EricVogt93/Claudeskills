---
name: code-refactoring
description: "Systematisches, verhaltenserhaltendes Refactoring in drei Pässen: (1) Standard-Code-Qualität — Komplexität, tiefe Verschachtelung, Hardcoding, Abstraktionsniveau; (2) Vereinfachung; (3) Kompression LLM-typisch verboser Muster. Nutzen, wenn der Nutzer refactorn, aufräumen, vereinfachen, entschlacken oder Code-Qualität verbessern will — und als Selbstkorrektur, nachdem selbst größere Mengen Code generiert wurden (LLM-Code tendiert zu Verbosity)."
---

# Code-Refactoring

Refactoring heißt: **Struktur verbessern, Verhalten erhalten.** Alles hier ist diesem Grundsatz untergeordnet.

## Phase 0 — Sicherheitsnetz (immer zuerst)

1. **Scope festlegen**: Welche Dateien/Module? Bei „refactor das Projekt" ohne Eingrenzung: Hotspots identifizieren (längste Funktionen, tiefste Verschachtelung, Duplikate) und die 3–5 schlimmsten vorschlagen statt alles anzufassen.
2. **Tests laufen lassen** (Baseline). Keine Tests vorhanden? Dann für die betroffenen kritischen Pfade erst charakterisierende Tests schreiben — oder, wenn das unverhältnismäßig ist, nur risikoarme Refactorings durchführen und das explizit sagen.
3. **Bugs sind kein Refactoring**: Findest du beim Lesen einen echten Fehler, melde ihn separat — nicht still mitfixen, das gehört nicht in ein Verhaltens-erhaltendes Diff.
4. Nach **jedem Pass**: Tests erneut laufen lassen. Rot = letzten Schritt zurücknehmen, nicht weiterstapeln.

## Pass 1 — Standard-Code-Qualität

Checkliste, in dieser Reihenfolge:

| Problem | Schwelle / Signal | Maßnahme |
|---|---|---|
| **Komplexität** | Funktion > ~40 Zeilen, mehr als ~4 Verzweigungspfade, tut erkennbar mehrere Dinge | In benannte Teilfunktionen extrahieren — Name beschreibt das *Was*, nicht das *Wie* |
| **Tiefe Verschachtelung** | > 3 Ebenen if/for/try | Guard Clauses & Early Returns; Bedingungen invertieren; innere Blöcke extrahieren; `else` nach `return` entfernen |
| **Hardcoding** | Magic Numbers/Strings, URLs, Pfade, Timeouts, Limits, Credentials im Code | Benannte Konstanten am Modulkopf; umgebungsabhängige Werte → Config/Env; Credentials **immer** raus. Ausnahme: einmalige, selbsterklärende Werte (`array[0]`, `n + 1`) nicht zwanghaft benennen |
| **Falsche Abstraktion** | Duplizierter Code (≥ 3 Vorkommen) ODER spekulative Interfaces/Factories/Wrapper ohne zweiten Nutzer | Rule of Three: erst beim dritten Vorkommen extrahieren. Umgekehrt: ungenutzte Flexibilität (Interface mit einer Implementierung, Config die nie variiert) → einstampfen. Duplikation ist billiger als die falsche Abstraktion |
| **Naming** | `data`, `temp`, `handleStuff`, Abkürzungen, Lügen (Name sagt X, Code tut Y) | Umbenennen nach Domänensprache; Konsistenz mit dem Rest des Projekts |
| **Toter Code** | Unerreichbare Zweige, auskommentierter Code, ungenutzte Exports/Parameter | Löschen (Git erinnert sich) |
| **Fehlerbehandlung** | Verschluckte Exceptions, inkonsistente Muster im selben Modul | An das im Projekt dominante Muster angleichen; niemals still verschlucken |

## Pass 2 — Simplify

Jetzt, wo die Struktur stimmt, den verbleibenden Code vereinfachen:

- **Bedingungen**: `if (x) return true; else return false;` → `return x;` — verschachtelte Negationen mit De Morgan auflösen; komplexe Prädikate in benannte Booleans/Funktionen ziehen.
- **Stdlib & Framework-Idiome** statt Handgestricktem: selbstgebaute Loops durch `map`/`filter`/`find`/Comprehensions ersetzen, Datums-/Pfad-/URL-Bastelei durch die Standardbibliothek, vorhandene Projekt-Utils wiederverwenden statt neu erfinden.
- **Indirektion entfernen**: Wrapper, die nur durchreichen; Einzeiler-Helper mit genau einem Aufrufer ohne Erklärwert → inline; Callback-/Promise-Ketten → async/await (bzw. das Idiom der Sprache).
- **Datenfluss**: Mutation über viele Schritte → Transformation/Pipeline, wo die Sprache das idiomatisch hergibt; Variablen so spät und so eng-gescoped wie möglich.
- **Grenze**: Simplify heißt *leichter zu lesen*, nicht *cleverer*. Ein Dreizeiler, den jeder versteht, schlägt den Einzeiler, den man zweimal lesen muss. Im Zweifel die langweilige Variante.

## Pass 3 — Kompression (LLM-Verbosity abbauen)

LLM-generierter Code ist systematisch zu geschwätzig. Diese Muster gezielt jagen:

| LLM-Verbosity-Muster | Fix |
|---|---|
| Kommentar wiederholt die Codezeile (`// Nutzer laden` über `loadUser()`) | Löschen. Kommentare nur für *Warum*, nie für *Was* |
| Docstring schwätzt die Signatur nach (`@param name — der Name`) | Löschen oder mit echtem Mehrwert füllen |
| Über-defensive Checks für unmögliche Zustände (null-Check direkt nach Konstruktion, dreifach validierter interner Aufruf) | Entfernen — validiert wird an Systemgrenzen (I/O, API, User-Input), nicht an jeder Funktion |
| `try/catch`, das nur loggt und re-throwt oder `console.log` + weiterwerfen | Entfernen; Fehler dort behandeln, wo man sie behandeln *kann* |
| Zwischenvariable mit Einmal-Nutzung ohne Erklärwert (`const result = compute(); return result;`) | Inline. Behalten nur, wenn der Name etwas erklärt |
| `else` nach `return`/`throw`/`continue` | `else` weg, Block ausrücken |
| Redundante Typ-Annotationen, wo Inferenz eindeutig ist | Weg (sofern Projekt-Linter nichts anderes verlangt) |
| Getter/Setter/Wrapper-Klassen ohne jede Logik | Direktzugriff bzw. schlichte Datenstruktur |
| „Beispiel-Nutzung"-Blöcke, Demo-`console.log`s, `if __name__ == "__main__"`-Spielwiesen in Bibliothekscode | Löschen (bzw. in Tests/Doku verschieben, wenn wertvoll) |
| Fallback-Kaskaden für Fälle, die nie eintreten (`value || default1 || default2`) | Auf den realen Fall reduzieren |

**Grenze der Kompression**: Sie endet, wo Lesbarkeit leidet. Kein Code-Golf, keine Mehrfach-Zuweisungen in einer Zeile, keine entfernten Kommentare, die ein echtes *Warum* erklärten (Workarounds, Bugreferenzen, nicht-offensichtliche Invarianten — die bleiben). Ziel ist Signal-zu-Rauschen, nicht minimale Zeilenzahl.

## Abschlussbericht

Kurz und messbar:
- **Metriken vorher → nachher**: Zeilen im Scope, längste Funktion, tiefste Verschachtelung, entfernte Duplikate/Hardcodings
- **Was bewusst NICHT angefasst wurde** und warum (fehlende Tests, öffentliche API, außerhalb des Scopes)
- Separat gemeldete Bug-Verdachtsfälle
- Teststatus (alle grün / was war vorher schon rot)

Öffentliche APIs, Wire-Formate, DB-Schemata und Verhalten bleiben unangetastet — Änderungen daran sind kein Refactoring und brauchen ein explizites Okay des Nutzers.
