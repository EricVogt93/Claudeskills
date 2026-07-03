# review-panel

Multi-LLM-Code-Review mit Kreuzvalidierung. Derselbe Diff geht **parallel** an GLM-5.2 und Kimi (über den `llm-delegate`-MCP-Server im `chat`-Modus, keine Dateiänderungen), Claude reviewt selbst als dritter Reviewer, **verifiziert jedes fremde Finding gegen den echten Code**, dedupliziert und berichtet nur Bestätigtes.

- Von 2–3 Reviewern unabhängig gefunden → **hoch-konfident**
- Widerlegte Findings werden mit Begründung ausgewiesen (transparent, was geprüft wurde)
- Bei Widerspruch entscheidet der Code-Beleg, nicht die Mehrheit

## Voraussetzung

Plugin **`llm-delegate`** (gleicher Marketplace) mit konfigurierten Keys (`ZAI_API_KEY`, `KIMI_API_KEY`). Fehlt ein Provider, läuft das Review mit den verbleibenden Reviewern weiter.

## Nutzung

```bash
/plugin install review-panel@claudeskills

/review-panel:review                 # Working-Tree-Diff
/review-panel:review main...HEAD     # Branch-Diff
/review-panel:review src/auth/       # gezielter Scope

# Oder autonom: „hol mal ne Zweitmeinung zu dem Diff ein"
```
