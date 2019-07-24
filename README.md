# Puppeteer Globus Scraper

Puppeteer is good at scraping web pages, but some content is "gated" by being stored in PDF files
which the user is redirected to for their browser to render.

Both Firefox and Chrome render PDFs by converting them to HTML representations, Firefox uses pdf.js
for this and Chrome some sort of an extension which is accessible through an `embed` object.

In Chrome, *Inspect* is available on elements in that HTML representation, but in the Elements page,
it highlights the `embed` node and won't go any further, so Puppeteer couldn't be used to inspect
and scrape the contents of a PDF by treating as an HTML page most likely.

We now have Puppeteer-Firefox as an experimental extension to Puppeteer which itself doesn't
implement PDF export, but it doesn't matter, because for this experiment I am interested in the
opposite.

Could Puppeteer Firefox be used to navigate to a PDF file and then query the DOM of the HTML
representation created from the PDF by Firefox using PDF.js? The text in the PDFs is selectable
in both and Firefox and Chrome so it should be possible to extract it as text if the DOM of the
rendered HTML representation is available.

Let's test this out using Puppeteer Firefox…

In any case, I've prototyped scraping a PDF using PDF.js alone in `index.mjs`.

## To-Do

Use text and image coordinates to group them into clusters by proximity and from
those clusters recognize ones which look like an item and parse out data from
the texts by their position relative to one another (vertically: name, price, …,
only a handful of variations of these datums in various order exist).

Find out how to straighten the images that come out skewed if they will be
needed (associate with an item), otherwise discard them.

Generate a JSON instead of page HTML files and finalize a landing page which
loads it and allows listing among the pages, then set up GitHub Pages.

Set up Azure Pipelines and run the extractor in one using a scheduled trigger.

`npx serve .` runs a web app (could be run in Puppeteer) that uses `canvas`
and `textLayer` and `imageLayer` to rip off the layouting.
Figure out why the `textLayer` is not getting called at all.
Use the dimensions from the `imageLayer` to generate the HTML files that are
generated in `npm start` with `node` scenario.
