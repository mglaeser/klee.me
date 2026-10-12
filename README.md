# Familie Klee

A small home on the web: [klee.me](https://klee.me).

A meadow of clover beneath a starry sky, with a little movement in the grass. The name becomes the landscape; selected clovers lead to the people and projects behind it.

## Make it personal

[site.config.json](site.config.json) keeps the everyday details in one place:

- `presetClovers` defines the linked clovers: their label, destination, colour, size and three or four leaves.
- `ui` holds the family name, subtitle and optional footer.
- `tuning` sets the rhythm of the meadow — grass, clovers, wind and stars.

The leaf silhouette and its delicate shading are inline SVGs in the stylesheet. Their neutral highlights and shadows let each clover keep its own colour.

## At home here

`index.html` is the page, `assets/` contains its styling and animation, and `site.config.json` supplies its content. `CNAME` connects the published site to **klee.me**.

The repository is the ready-to-host static site. Publish its root through GitHub Pages or another static host; no build step or application server is needed. Keep the configuration and assets beside the page, and serve it from the domain root.
