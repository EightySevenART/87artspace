# 87artspace

Website of 87artspace. Plain HTML/CSS/JS, hosted with GitHub Pages (no build step).

## Structure

- `index.html` – home: logo intro, current exhibition, the space, contact + imprint
- `about.html` – about page
- `archive.html` – all past exhibitions (newest year on top)
- `assets/css/style.css` – all styling (colours at the top in `:root`)
- `assets/js/main.js` – logo scroll motion and fade-in on scroll
- `assets/img/logo.svg` – logo (replace with the real file, same name)
- `assets/fonts/` – D-DIN-PRO (SIL Open Font License, see `OFL.txt`)

## New exhibition

1. Put images in `assets/img/exhibitions/` (JPG, max. ~2000 px wide).
2. Move the current exhibition from `index.html` into `archive.html` as a new `<article>`.
3. Update the "Current exhibition" section in `index.html`.

Images go inside a placeholder like this:

```html
<figure class="ph ph--wide reveal" style="margin:0">
  <img src="assets/img/exhibitions/title-01.jpg" alt="Installation view, Title, Artist">
</figure>
```
