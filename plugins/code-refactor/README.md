# code-refactor

Systematisches, verhaltenserhaltendes Refactoring in **drei geordneten Pässen** — als Skill, den Claude selbst zieht (bei „refactor / aufräumen / vereinfachen" und als Selbstkorrektur nach eigener Code-Generierung), plus explizitem `/code-refactor:refactor`-Command.

## Die drei Pässe

| Pass | Deckt ab | Beispiele |
|---|---|---|
| **1 — Code-Qualität** | Komplexität, tiefe Verschachtelung, Hardcoding, Abstraktionsniveau, Naming, toter Code, Fehlerbehandlung | Funktionen > 40 Zeilen extrahieren, Guard Clauses statt Nesting > 3, Magic Values → Konstanten/Config, Rule of Three (und Rückbau spekulativer Abstraktionen) |
| **2 — Simplify** | Lesbarkeit der verbleibenden Struktur | Bedingungen vereinfachen, Stdlib-/Framework-Idiome statt Handgestricktem, Durchreich-Wrapper inline, Mutation → Pipeline |
| **3 — Kompression** | LLM-typische Verbosity | Was-Kommentare, signatur-nachschwätzende Docstrings, über-defensive Checks abseits der Systemgrenzen, nutzlose Zwischenvariablen, log-and-rethrow, `else` nach `return`, Demo-Code |

Die Reihenfolge ist bewusst: erst Struktur (Pass 1), dann Lesbarkeit (Pass 2), dann Rauschen (Pass 3) — komprimieren, bevor die Struktur stimmt, zementiert schlechte Form.

## Leitplanken

- **Verhalten erhalten**: Tests als Baseline vor dem ersten Edit, erneut nach jedem Pass; ohne Tests nur risikoarme Refactorings oder erst charakterisierende Tests.
- **Bugs ≠ Refactoring**: Gefundene Fehler werden gemeldet, nicht still mitgefixt.
- **Kompression hat eine Grenze**: Kein Code-Golf; Warum-Kommentare (Workarounds, Invarianten, Bugreferenzen) bleiben. Ziel ist Signal-zu-Rauschen, nicht Zeilenzahl.
- **Tabu ohne explizites Okay**: öffentliche APIs, Wire-Formate, DB-Schemata.
- Abschlussbericht mit Vorher/Nachher-Metriken (Zeilen, längste Funktion, tiefste Verschachtelung) und dem, was bewusst nicht angefasst wurde.

## Nutzung

```bash
/plugin install code-refactor@claudeskills

# Explizit:
/code-refactor:refactor src/services/billing.ts
/code-refactor:refactor src/utils nur Pass 3

# Oder autonom: einfach sagen „räum das mal auf" / „das ist zu verbose" —
# Claude lädt den Skill selbst.
```

Kombiniert sich gut mit `llm-delegate`: von GLM/Kimi implementierter Code kann direkt danach durch die drei Pässe laufen.
