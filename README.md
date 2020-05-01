# Globus

Globus provides a PDF catalog of offers for the period. This is a good exercise for PDF scraping.

Puppeteer cannot be used, because it cannot navigate to a PDF. The PDF viewer component in Chrome
is a native component which is not available in Chromium. One would have to use PDF.js either in
or outside of Puppeteer to get the job done.

Playwright Firefox can be used as Firefox uses PDF.js internally when navigating to PDF documents.

## To-Do

### Use Playwright Firefox to scrape the PDF instead

Like in https://github.com/TomasHubelbauer/albert

### Use text and image coordinates to group them into clusters by proximity

from those clusters recognize ones which look like an item and parse out data from
the texts by their position relative to one another (vertically: name, price, …,
only a handful of variations of these datums in various order exist).

### Generate an HTML page for visualizing what the script associated in clustering

### Set up Github Actions and run the extractor in one using a scheduled trigger
