import fs from 'fs-extra';
// import fetch from 'node-fetch';
import PDFJS from 'pdfjs-dist';
import bitmap from '@ericandrewlewis/bitmap';

void async function () {
  await fs.ensureDir('bmps');

  // https://www.globus.cz/cerny-most/akce.html
  // const response = await fetch('https://www.globus.cz/common/files/virtual_leaflets/335/prcm/prcm.pdf');
  // const arrayBuffer = await response.arrayBuffer();
  const arrayBuffer = (await fs.readFile('prcm.pdf')).buffer;

  const document = await PDFJS.getDocument(arrayBuffer).promise;
  for (let index = 0; index < document.numPages; index++) {
    console.log(`Loading page ${index + 1}/${document.numPages}…`);
    const page = await document.getPage(index + 1);

    console.log('Extracting texts:');
    for (const text of (await page.getTextContent()).items) {
      // TODO: See how `text.transform` relates to the transforms collected below to figure out image transforms
      console.log('\t', text.str, text.transform);
    }

    console.log('Extracting images:');
    const ops = await page.getOperatorList();
    for (let index = 0; index < ops.fnArray.length; index++) {
      const fn = ops.fnArray[index];
      const args = ops.argsArray[index];

      // TODO: See if text extraction could be intertwined with this maybe
      switch (fn) {
        case PDFJS.OPS.transform: {
          // TODO: Resolve the image X and Y coordinates by applying these matrices
          // https://en.wikipedia.org/wiki/Transformation_matrix#Examples_in_2D_computer_graphics
          //console.log(args);
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
          const filename = 'bmps/' + args[0] + '.bmp';

          console.log(`Saving ${filename} (${width}x${height})…`, args);
          await bitmap.createBitmapFile({ filename, imageData, width, height, bitsPerPixel: 24 });
          break;
        }

        default: {
          //console.log(fn, Object.keys(PDFJS.OPS)[Object.values(PDFJS.OPS).indexOf(fn)], args);
        }
      }
    }
  }
}()
