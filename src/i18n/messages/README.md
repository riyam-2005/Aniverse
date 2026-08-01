# i18n messages — status

`en.json` is the real, wired-up source of truth.

`bn.json` and `hi.json` currently contain the **same English text as
`en.json`**, not real translations — they're placeholders so picking
Bengali or Hindi in the language switcher never shows broken/missing text,
just untranslated English, until someone fills them in.

## To add a real translation

Edit the *values* in `bn.json` / `hi.json` — keep the keys identical to
`en.json`. Nothing else needs to change; `useTranslations()` picks up new
values automatically.

```json
// en.json
{ "nav": { "trending": "Trending" } }

// bn.json — only the value changes
{ "nav": { "trending": "ট্রেন্ডিং" } }
```

## Coverage

This pass wired the *mechanism* end-to-end (locale switcher in the navbar,
localStorage persistence, the `useTranslations` hook) and applied it to the
navbar and footer — the chrome visible on every page — as a working
demonstration. Page content (home, trending, anime detail, forms, etc.)
still renders hardcoded English strings and hasn't been migrated to
`useTranslations()` yet. Extending coverage is mechanical: wrap a string in
`t("namespace.key")`, add the key to all three message files.
