# OpenArtifacts

Single HTML file for prompting an LLM and running the resulting front-end code immediately in an iframe. Supports JSX & external libraries. [Demo](http://mayfer.github.io/open-artifacts/)

# Instructions

Just load `index.html` on a browser lol

# How does it work?

It uses `esbuild-wasm` to bundle your JSX React code right on the browser, uses CDNs to load all npm packages, and runs it in an iframe.  It's hacky but it works (usually)
