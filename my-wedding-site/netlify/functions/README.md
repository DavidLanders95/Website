# Netlify Functions Directory

Place server-side functions here. Netlify will bundle code in this folder according to the `functions = "netlify/functions"` setting in `netlify.toml`.

Best practices:
- Access secrets only via `process.env` at runtime; do not hard-code secret values.
- Return only non-sensitive data to clients.
- Avoid including raw private keys or spreadsheet IDs in client responses.

Example skeleton:
```js
// stats.js
exports.handler = async () => {
  const range = process.env.GOOGLE_SHEETS_RANGE; // safe usage
  return { statusCode: 200, body: JSON.stringify({ ok: true, rangeSet: Boolean(range) }) };
};
```
