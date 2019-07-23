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

Use text and image coordinates to recognize clusters following patterns and use
that information to parse out data from the texts and associate images with the
data from the texts.

See if the `transform` op (or any extra/others) can be used to keep a track of
the coordinates at which the image file will be placed.

Figure out and fix the problem with some images being skewed as if the length of
their data array didn't agree to the dimensions embedded in the PDF.
