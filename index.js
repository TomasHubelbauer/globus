window.addEventListener('load', async () => {
  const response = await fetch('prcm.pdf');
  const arrayBuffer = await response.arrayBuffer();
  const document = await pdfjsLib.getDocument(arrayBuffer).promise;
  const pageCount = document.numPages;
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    console.log(`Page #${pageNumber}`);
    const page = await document.getPage(pageNumber);
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d');
    const viewport = page.getViewport(1);
    await page.render({
      canvasContext: context,
      viewport,
      textLayer: {
        beginLayout(...args) {
          console.log('text layer being layout', args);
        },
        endLayout(...args) {
          console.log('text layer end layout', args);
        },
        appendText(...args) {
          console.log('text layer append text', args);
        },
      },
      imageLayer: {
        beginLayout() {
          console.log('image layer being layout');
        },
        endLayout() {
          console.log('image layer end layout');
        },
        appendImage(...args) {
          console.log('image layer append image', args);
        },
      },
    }).promise;

    break;
  }
});
