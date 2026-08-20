# Sinthanai-Stat

Personal biostatistics / epidemiology portfolio website for **Sinthanai Selvan Palanisamy**, Project Research Scientist‑I (Biostatistics), ICMR – National Institute of Epidemiology, Chennai.

Live structure:

- `index.html` — profile / about / experience / education / publications / skills / contact
- `resources.html` — presentation slides, a **sample size & power calculator**, and a **basic statistics calculator**
- `assets/css/style.css` — all styling
- `assets/js/main.js` — navigation & tab behaviour
- `assets/js/calculators.js` — the statistics engine (pure client‑side JavaScript, no external libraries)
- `assets/images/` — profile photos
- `assets/cv/Sinthanai_Selvan_CV.pdf` — downloadable CV
- `assets/ppts/` — drop presentation files here (see "Adding a presentation" below)

## Publishing with GitHub Pages

1. Push this folder's contents to the root of the `Sinthanai-Stat` repository on GitHub (`github.com/Sinthanai-Stat/Sinthanai-Stat`).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to `main` (or `master`) and folder to `/ (root)`, then **Save**.
5. After a minute, your site will be live at:

   ```
   https://sinthanai-stat.github.io/Sinthanai-Stat/
   ```

   (GitHub shows the exact URL at the top of the Pages settings page once it's live.)

If you'd rather have the site at the shorter `https://sinthanai-stat.github.io/` (no `/Sinthanai-Stat/` in the URL), rename this repository to `Sinthanai-Stat.github.io` in **Settings → General → Repository name** — everything else stays the same, since all links in this site are relative.

### Quick push from your computer

```bash
cd Sinthanai-Stat
git init
git add .
git commit -m "Launch biostatistics portfolio site"
git branch -M main
git remote add origin https://github.com/Sinthanai-Stat/Sinthanai-Stat.git
git push -u origin main
```

Then enable Pages as described above.

## Adding a presentation (PPT)

1. Copy your `.pptx` (or exported `.pdf`) file into `assets/ppts/`.
2. Open `resources.html`, find the `<div class="ppt-grid" id="pptGrid">` section, and add a card like:

   ```html
   <div class="ppt-card">
     <div class="file-icon">PPT</div>
     <h3>Sample Size &amp; Power Analysis Workshop</h3>
     <p>Slides from the NIMHANS Bengaluru workshop, 2024.</p>
     <a href="assets/ppts/sample-size-workshop.pptx" class="btn btn-outline" download>Download</a>
   </div>
   ```

3. If you no longer want the "Slides coming soon" placeholder, delete the `<div class="empty-state" id="pptEmptyState">…</div>` block right below the grid.

## Updating your CV

Replace `assets/cv/Sinthanai_Selvan_CV.pdf` with a new export using the exact same filename — every link on the site already points to it, so nothing else needs to change.

## Local preview

No build step is required — it's plain HTML/CSS/JS. To preview locally:

```bash
cd Sinthanai-Stat
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Notes on content

- The phone number and referee names from the CV were intentionally left off the public site for privacy; only email, Google Scholar, and ORCID are shown. Add them back in `index.html` if you'd like.
- The sample size / power calculator uses standard z‑approximation formulas — good for planning and teaching, but confirm with exact methods or statistical software (R, STATA, `pwr` package, etc.) before finalising a study protocol.
- The statistics calculator's t‑tests and chi‑square test run entirely in the browser (no data is sent anywhere).
