# Example portfolio

An example portfolio site for an emerging graphic designer, made as a teaching model. The designer, Gromit Forger, is fictional.

Open `guide.html` in a browser for the process and design principles behind it. This file covers only the technical side.

## How it is built

Plain HTML, CSS and JavaScript. No framework and no build step.

- `content/` holds all the words and settings as JSON files. `settings.json` sets the name, headline, menu, colors and the order of projects. Each project is one file in `content/projects/`.
- `index.html`, `project.html`, `about.html` and `resume.html` are empty frames. `js/site.js` and `js/pages.js` read the content files and build each page.
- A project page is a list of blocks (text, image, gallery, video, quote and placeholder), rendered in order by the `Blocks` functions in `js/site.js`.
- `css/style.css` holds the whole design. The tokens at the top set the grid (12, 6 and 4 columns), the type sizes and the spacing steps.
- `print.html` lays out the PDF portfolio. `resume.html` is the source of the resume PDF. Print either page to PDF from the browser and save it into `files/`.
- `.pages.yml` at the top of the repository lets [Pages CMS](https://pagescms.org) edit the content files through forms.

## Password screen

`passwordHash` in `content/settings.json` turns on a simple password screen. It holds the SHA-256 hash of the password, not the password itself. To change the password, replace it with the hash of the new one (for example, `echo -n newpassword | shasum -a 256`). Remove the line to turn the screen off. Each browser asks once and then remembers. Changing the password asks everyone again, so change it every quarter.

This only keeps casual visitors and search engines out. Every file in the site and the repository is still public, so never rely on it to protect anything private.

## Preview locally

Browsers block the content files when a page is opened straight from disk, so run a small server in this folder and visit `http://localhost:8000`.

```
python3 -m http.server 8000
```

## Publish

Turn on GitHub Pages for the repository (Settings, then Pages, deploy from the `main` branch). The site appears under `/portfolio/`.
