const imageInput = document.getElementById("imageInput");
const convertButton = document.getElementById("convertButton");
const outputDiv = document.getElementById("output");
const imagePreviewsDiv = document.getElementById("imagePreviews");
let selectedImages = [];

// Prevent default behavior when dropping files
imagePreviewsDiv.addEventListener("dragover", (e) => {
  e.preventDefault();
  imagePreviewsDiv.classList.add("drag-over");
});

imagePreviewsDiv.addEventListener("dragleave", (e) => {
  e.preventDefault();
  imagePreviewsDiv.classList.remove("drag-over");
});

// Handle the dropped files
imagePreviewsDiv.addEventListener("drop", (e) => {
  e.preventDefault();
  const droppedFiles = e.dataTransfer.files;
  addImagePreviews(droppedFiles);
  selectedImages = selectedImages.concat(Array.from(droppedFiles));
});

convertButton.addEventListener("click", async () => {
  if (selectedImages.length > 0) {
    const pdfDoc = await generatePDFFromImages(selectedImages);
    const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });

    outputDiv.innerHTML = `<embed width="100%" height="600px" src="${pdfDataUri}" type="application/pdf" />`;
    // Clear existing image previews
    imagePreviewsDiv.innerHTML = "";
  }
});

imageInput.addEventListener("change", () => {
  const imageFiles = imageInput.files;
  addImagePreviews(imageFiles);
  selectedImages = selectedImages.concat(Array.from(imageFiles));
});

function addImagePreviews(imageFiles) {
  for (const imageFile of imageFiles) {
    const imagePreview = document.createElement("img");
    imagePreview.src = URL.createObjectURL(imageFile);
    imagePreview.classList.add("image-preview");
    imagePreviewsDiv.appendChild(imagePreview);
  }
}

async function generatePDFFromImages(imageFiles) {
  const pdfDoc = await PDFLib.PDFDocument.create();

  for (const imageFile of imageFiles) {
    const imageBytes = await fetch(URL.createObjectURL(imageFile)).then(
      (response) => response.arrayBuffer()
    );
    const image = await pdfDoc.embedPng(imageBytes);
    const page = pdfDoc.addPage([image.width, image.height]);
    const { width, height } = page.getSize();
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return pdfDoc;
}

const batchSize = 10; // Process 10 images at a time

convertButton.addEventListener("click", async () => {
  const imageFiles = imageInput.files;
  const totalImages = imageFiles.length;

  if (totalImages > 0) {
    let startIndex = 0;
    let pdfDoc = await generatePDFFromImages([]);

    const generateNextBatch = async () => {
      const endIndex = Math.min(startIndex + batchSize, totalImages);
      const batchImages = Array.from(imageFiles).slice(startIndex, endIndex);
      const batchPdf = await generatePDFFromImages(batchImages);

      batchPdf.getPages().forEach((page) => {
        pdfDoc.addPage().drawPage(page);
      });

      startIndex = endIndex;

      if (startIndex < totalImages) {
        // Process the next batch
        await generateNextBatch();
      } else {
        const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
        outputDiv.innerHTML = `<embed width="100%" height="600px" src="${pdfDataUri}" type="application/pdf" />`;
        // Clear existing image previews
        imagePreviewsDiv.innerHTML = "";
      }
    };

    generateNextBatch();
  }
});
