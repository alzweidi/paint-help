# Paint Mixer

A reference-driven paint mixing assistant for traditional painters. Upload a reference image, tell it which paints you own, and get practical mixing recipes for each extracted color.

Live site: https://helpmepaint.netlify.app/

![Paint Mixer interface](Screenshot%202026-01-23%20at%2011.26.42%E2%80%AFAM.png)
![Reference analysis and recipes](Screenshot%202026-01-23%20at%2011.27.55%E2%80%AFAM.png)

## What this does

Paint Mixer turns a reference image into a small set of target colors, then suggests the closest mixes you can make using your own palette. It is built to help painters plan and execute a painting with the paints they already have on hand.

## Workflow

1. Upload a reference image.
2. Pick a color count (or keep Auto) and choose dominant vs distinct extraction.
3. (Optional) Select a region to focus the extraction on a specific area.
4. Review extracted colors, then click a swatch to inspect it.
5. Add or remove paints from your palette and save loadouts for different paint sets.
6. Use the suggested mixing recipes and the visual accuracy tools to judge the match.

Supported formats: PNG, JPG/JPEG, and WebP.

## Artist workflow (example)

1. Start with your go-to palette loadout (or save a new one for this project).
2. Upload the reference image and let Auto pick a manageable color set.
3. Switch between dominant vs distinct to decide whether you want big shapes or nuanced accents.
4. Click a swatch and scan the highlight/heatmap to see where that color actually appears.
5. Mix using the suggested recipe, then adjust your real paint by eye and save the mix if it’s a keeper.

## Features

- Reference image upload with automatic color extraction.
- Color count control, plus dominant vs distinct color modes.
- Region selection to analyze only part of the image.
- Paint palette management with save/load/delete loadouts.
- Paint name search powered by the color.pizza API.
- Recipe suggestions that estimate match quality for each target color.
- Visual accuracy tools (match meter, delta E, highlight, and heatmap).

## Visual accuracy tools

- Side-by-side target vs mix preview for each extracted color.
- Match meter with delta E for quick accuracy checks.
- Highlight overlay shows where the target color appears in the reference.
- Difference heatmap: green indicates close match, red indicates areas that are off.

## How it works (short version)

- The image is downsampled and clustered to find dominant colors.
- Each extracted color is matched against your palette using a paint mixing model (Mixbox).
- Match quality is measured with delta E in Lab space.
- Suggestions are presented per color with coverage and recipe details.

## Limitations and notes

- Mixbox is a mathematical approximation of paint mixing, not a physical pigment simulation.
- Paint names are sourced from color.pizza and are generic color names, not brand-accurate paint labels.
- The heatmap is based on RGB distance (not perceptual Lab distance), so it’s a fast visual guide rather than a colorimetry tool.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Testing

```bash
npm test
```

## License

[MIT](./LICENSE)

## Credits

This project is a fork of [paint-mixer](https://github.com/Palette-Pickers/paint-mixer) by **Beekman** / Palette-Pickers.
