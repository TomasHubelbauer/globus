import fs from 'fs-extra';
import fetch from 'node-fetch';
import PDFJS from 'pdfjs-dist';
import bitmap from '@ericandrewlewis/bitmap';

void async function () {
  await fs.ensureDir('bmps');

  // https://www.globus.cz/cerny-most/akce.html
  const response = await fetch('https://www.globus.cz/common/files/virtual_leaflets/335/prcm/prcm.pdf');
  const arrayBuffer = await response.arrayBuffer();
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
          console.log(args);
          break;
        }
        case PDFJS.OPS.paintImageXObject: {
          const { data, width, height } = await page.objs.get(args[0]);
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
