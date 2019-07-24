import fs from 'fs-extra';
// import fetch from 'node-fetch';
import PDFJS from 'pdfjs-dist';
import bitmap from '@ericandrewlewis/bitmap';

void async function () {
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
          if (text) {
            pageSource += `<span style="left: ${textMatrix[4]}px; top: ${1000 - textMatrix[5]}px;">${text}</span>\n`;
          }

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

          // Ignore small or tall/wide images which are more likely to be graphics than photos
          if (width * height < 10 * 1000 || width < 100 || height < 100) {
            break;
          }

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
          pageSource += `<img src="${filename.slice('out/'.length)}" style="left: ${imageMatrix[4]}px; top: ${1000 - imageMatrix[5]}px;" />\n`;
          break;
        }
      }
    }

    await fs.writeFile(`out/${index + 1}.html`, pageSource);
  }
}()
