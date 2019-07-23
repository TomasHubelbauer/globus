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

In any case, scraping PDFs off the Internet could probably be done using PDF.js alone, just whip
up a Node script to download the PDF from a known URL (might use Puppeteer to scrape the URL out)
and then load it using PDF.js and see if it has an API to extract the texts.

```js
const document = await PDFJS.getDocument('file.pdf').promise;
for (let index = 0; index < document.pdfInfo.numPages; index++) {
  const page = await document.getPage(index + 1);
  const text = await page.getTextContent();
  // Texts are in `text.items`… https://stackoverflow.com/a/55263651/2715716
  
  // And now onto images: https://stackoverflow.com/a/39855420/2715716
  const opList = await page.getOperatorList();
  for (let obj of opList.fnArray.filter(fn => fn === PDFJS.OPS.paintJpegXObject)) {
    const image = await page.objs.get(obj[0]);
    // Should be `<img src="data:…" />`
  }
}
```
