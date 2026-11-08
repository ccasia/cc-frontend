// Takes the raw image URL and the crop area coordinates from react-easy-crop,
// draws only the cropped portion onto an HTML canvas, and returns it as a File object.
export default function getCroppedImg(imageSrc, pixelCrop, fileName = 'campaign-image.jpg') {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      // JPEG has no transparency, so paint white first or clear areas turn black
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
        const fileWithPreview = Object.assign(croppedFile, {
          preview: URL.createObjectURL(croppedFile),
        });
        resolve(fileWithPreview);
      }, 'image/jpeg');
    };
  });
}
