# Docs-For-Any-Browser
Have you ever wanted to use something like Google Docs on the PS4/5 or Switch1/2 browser? Well now you can! (Of course you need to use BrowseDNS for some console browsers)

## OpenPage Docs

This repository is a dependency-light, static document editor for GitHub Pages. It supports browser-native rich text editing, headings, bold, italics, underline, colors, highlights, alignment, lists, links, images, tables, checklists, search and replace, printing, local autosave, HTML download, and DOCX import/export.

Open `index.html` locally or enable GitHub Pages for the repository. The editor stores its working copy in the browser. The **Save** action also offers an optional GitHub Contents API commit for users who provide a repository path and a short-lived fine-grained token with `Contents: Read and write` permission. GitHub Pages itself cannot write to a repository without that authenticated API request.

The homepage reads HTML and DOCX files from this repository through the public GitHub Contents API. The editor automatically saves locally while you work and attempts a GitHub commit every three minutes. The **Save** action commits immediately. Manual **Download** creates a DOCX file in the browser.

Because GitHub Pages is static hosting, automatic commits require a fine-grained GitHub token with `Contents: Read and write`. Use **Connect repository** once; the app targets this repository automatically and keeps the token only in the browser's local storage. Without a token, the homepage and local editing still work, but commits fall back to local autosave.

The DOCX helper is loaded from jsDelivr at runtime. For fully offline use, download `jszip.min.js` into the repository and change the script reference in `index.html` to that local file.
