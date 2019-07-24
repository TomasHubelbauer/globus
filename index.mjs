import fs from 'fs-extra';
// import fetch from 'node-fetch';
import PDFJS from 'pdfjs-dist';
import bitmap from '@ericandrewlewis/bitmap';

import puppeteer from 'puppeteer-firefox';
//import puppeteer from 'puppeteer';

void async function () {
  const browser = await puppeteer.launch({ headless: false });
  const pages = await browser.pages();
  const page = pages[0];
  await page.goto('https://www.globus.cz/common/files/virtual_leaflets/335/prcm/prcm.pdf');
  const pageCount = await page.$eval('#numPages', span => Number(span.textContent.slice('of '.length)));
  const pageNumberInput = await page.$('#pageNumber');
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    console.log(pageNumber, '/', pageCount);
    await pageNumberInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.keyboard.type(pageNumber.toString());
    await page.keyboard.press('Enter');

    // Wait for the page container element to appear and to have it loaded data attribute appear
    const textLayerDiv = await page.waitForSelector(`.page[data-page-number="${pageNumber}"][data-loaded="true"] .textLayer`);

    // Wait for the loading indicators to disappear indicating the canvas wrapper and the text layer mounted
    await page.waitForSelector(`.page[data-page-number="${pageNumber}"] .loadingIcon`, { hidden: true });
    await page.waitForSelector('#pageNumber.visiblePageIsLoading', { hidden: true });

    // Give it another second because there doesn't seem to be any stable way to tell it all renderer
    await page.waitFor(1000);

    const texts = await textLayerDiv.$$eval('span', spans => spans.map(span => ({ text: span.textContent.trim() })));
    console.log(texts);
  }

  await browser.close();
  return;

  await fs.ensureDir('out');

  // https://www.globus.cz/cerny-most/akce.html
  // const response = await fetch('https://www.globus.cz/common/files/virtual_leaflets/335/prcm/prcm.pdf');
  // const arrayBuffer = await response.arrayBuffer();
  const arrayBuffer = (await fs.readFile('prcm.pdf')).buffer;

  const document = await PDFJS.getDocument(arrayBuffer).promise;
  for (let index = 0; index < document.numPages; index++) {
    console.log(`Processing page ${index + 1}/${document.numPages}…`);
    const page = await document.getPage(index + 1);

    let textMatrix;
    let imageMatrix;
    let pageSource = `<title>Page #${index + 1}</title>\n<style>span, img { position: absolute; }</style>\n`;

    const ops = await page.getOperatorList();
    for (let index = 0; index < ops.fnArray.length; index++) {
      const fn = ops.fnArray[index];
      const args = ops.argsArray[index];

      switch (fn) {
        case PDFJS.OPS.setTextMatrix: {
          textMatrix = args;
          break;
        }
        case PDFJS.OPS.showText: {
          if (args.length !== 1) {
            throw new Error('Expected text to be an array with a single array element.');
          }

          const text = args[0].filter(a => a.unicode).map(a => a.unicode).join('').trim();
          if (!text) {
            break;
          }

          // For the matrix see https://github.com/mozilla/pdf.js/issues/10498
          pageSource += `<span style="left: ${textMatrix[4]}px; top: ${page.view[3] - textMatrix[5] + textMatrix[3] - 3}px; width: ${textMatrix[0]}px; height: ${textMatrix[3]}px;">${text}</span>\n`;
          break;
        }
        case PDFJS.OPS.transform: {
          imageMatrix = args;
          break;
        }
        case PDFJS.OPS.paintImageXObject: {
          const obj = await page.objs.get(args[0]);

          /** @type {Uint8ClampedArray} */
          const _data = obj.data;

          /** @type {Number} */
          const width = obj.width;

          /** @type {Number} */
          const height = obj.height;

          // Swap lines to go top to bottom instead of bottom to top
          const data = new Uint8Array(_data.length);
          for (let y = 0; y < height; y++) {
            data.set(_data.slice((height - y - 1) * width * 3, (height - y - 1) * width * 3 + width * 3), y * width * 3);

            // Convert from BGR to RGB
            for (let x = 0; x < width; x++) {
              const offset = y * width * 3 + x * 3;
              const slice = data.slice(offset, offset + 3).reverse();
              data.set(slice, offset);
            }
          }

          const imageData = bitmap.padImageData({ unpaddedImageData: Buffer.from(data.buffer), width, height });
          const filename = 'out/' + args[0] + '.bmp';

          // TODO: Figure out why the scale here gives weird numbers, do the previous transforms affect this?
          // If yes I might need to keep the track of them and multiply them as they come to get the correct scale here.
          const [_scaleX, _skewY, _skewX, _scaleY, transformX, transformY] = imageMatrix;

          // TODO: Adjust `y` to be distance from top not from bottom (PDF default) by subtracting it from `page.view`
          const x = Math.round(transformX);
          const y = Math.round(transformY);

          await bitmap.createBitmapFile({ filename, imageData, width, height, bitsPerPixel: 24 });

          // For the matrix see https://github.com/mozilla/pdf.js/issues/10498
          pageSource += `<img src="${filename.slice('out/'.length)}" style="left: ${imageMatrix[4]}px; top: ${page.view[3] - imageMatrix[5] + imageMatrix[3] - 3}px; width: ${imageMatrix[0]}px; height: ${imageMatrix[3]}px;" />\n`;
          break;
        }
      }
    }

    await fs.writeFile(`out/${index + 1}.html`, pageSource);
  }
}()
