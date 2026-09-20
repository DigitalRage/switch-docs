# Docs-For-Any-Browser
Have you ever wanted to use something like Google Docs on the PS4/5 or Switch1/2 browser? Well now you can! (Of course you need to use BrowseDNS for some console browsers)

## Switch Docs

This repository is a dependency-light, static document editor for GitHub Pages. It supports browser-native rich text editing, headings, bold, italics, underline, colors, highlights, alignment, lists, links, images, tables, checklists, search and replace, printing, local autosave, HTML download, and DOCX import/export.

Run `npm install`, set `GITHUB_TOKEN` from the server environment, and run `npm start`. The server serves the editor, relays live WebSocket updates between people editing the same document, and commits document changes to `DigitalRage/switch-docs` automatically. The token is never sent to the browser.

The homepage reads HTML and DOCX files from this repository through the public GitHub Contents API. The editor also keeps a local fallback copy. Manual **Download** creates a DOCX file in the browser.

Deploy the Node service wherever the app needs real-time collaboration. GitHub Pages alone can provide read-only/static editing because it cannot safely store a write token or host WebSockets.

The DOCX helper is loaded from jsDelivr at runtime. For fully offline use, download `jszip.min.js` into the repository and change the script reference in `index.html` to that local file.
