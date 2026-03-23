---
name: deepl-translate
description: Translate text with the DeepL REST API using the DEEPL_API_KEY environment variable and a bundled curl helper. Use when the user explicitly asks for DeepL, wants DeepL as the translation mechanism, or needs DeepL language or usage information.
license: MIT
compatibility: opencode
metadata:
  audience: general
  language: bash
---

## When to use this skill

Use this skill only when the user explicitly asks for DeepL or names DeepL as the translation engine.
Do not translate text yourself and claim it came from DeepL.

## Requirement

`DEEPL_API_KEY` must be present in the environment.
The helper uses `curl` against DeepL's `/v2/translate`, `/v2/languages`, and `/v2/usage` endpoints.
It uses `https://api-free.deepl.com` for keys ending in `:fx`; otherwise it uses `https://api.deepl.com`.

## Usage

**DO NOT CREATE A NEW SCRIPT!** Use the bundled helper:

```bash
printf '%s' 'Hello, world!' | .opencode/skills/deepl-translate/run.sh translate --target-lang DE
```

Prefer stdin for all free-form text because it is the most shell-safe option.
Use `--text` only when the text is hardcoded and trusted.

For longer text or content with quotes, pipe the text through stdin:

```bash
printf '%s' "$TEXT" | .opencode/skills/deepl-translate/run.sh translate --target-lang FR
```

In interactive `bash` or `zsh`, `!` is expanded by the shell before the helper sees the argument, which is why stdin is the safest default.

## Commands

- `translate --target-lang CODE [--source-lang CODE] [--text TEXT]`
- `languages --type source|target`
- `usage`

The `translate` command returns DeepL's JSON response, including `translations[*].text`, `detected_source_language`, and `billed_characters` when requested.

## Translation workflow

1. If `DEEPL_API_KEY` is missing, tell the user you cannot use DeepL yet.
2. Use `languages --type target` if you need to confirm a language code or whether `supports_formality` is true.
3. Use `--context` for short or ambiguous strings such as UI copy.
4. If you pass `--glossary-id`, also pass `--source-lang` because DeepL requires it.
5. Use `--tag-handling html` or `--tag-handling xml` when translating markup.
6. Use `usage` or `--show-billed-characters` when the user asks about quota or billing.

## Examples

```bash
printf '%s' 'Please review the attached proposal.' | .opencode/skills/deepl-translate/run.sh translate --target-lang JA
printf '%s' 'Can you send the invoice today?' | .opencode/skills/deepl-translate/run.sh translate --target-lang DE --source-lang EN --formality more
printf '%s' '<p>Hello <strong>world</strong></p>' | .opencode/skills/deepl-translate/run.sh translate --target-lang ES --tag-handling html
.opencode/skills/deepl-translate/run.sh usage
```
