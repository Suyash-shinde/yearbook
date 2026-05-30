// Builds a transparent "crumpled paper" overlay PNG in the browser, so it can
// be dropped into the PDF (react-pdf can't run SVG filters itself). We render
// the same feTurbulence + lighting recipe the website uses into an <img>, draw
// it to a canvas, then convert the brightness into alpha so only the creases
// show as soft dark shadows. Result is cached after the first call.
let cached;

const W = 794; // A4 width  @ ~96dpi
const H = 1123; // A4 height @ ~96dpi

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <filter id="c">
    <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="5" seed="7" result="t"/>
    <feDiffuseLighting in="t" lighting-color="#ffffff" surfaceScale="6" diffuseConstant="1.1">
      <feDistantLight azimuth="235" elevation="80"/>
    </feDiffuseLighting>
  </filter>
  <rect width="100%" height="100%" filter="url(#c)"/>
</svg>`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getPaperTextureDataUrl() {
  if (cached !== undefined) return cached;
  try {
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;
    const img = await loadImage(url);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);

    const image = ctx.getImageData(0, 0, W, H);
    const px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = px[i]; // grayscale, so R==G==B
      // Flat areas are near-white (alpha ~0); creases are darker (visible).
      const alpha = Math.max(0, 255 - lum) * 0.45;
      px[i] = 60; // dark brown tint
      px[i + 1] = 45;
      px[i + 2] = 30;
      px[i + 3] = alpha;
    }
    ctx.putImageData(image, 0, 0);

    cached = canvas.toDataURL("image/png");
  } catch {
    // If the browser blocks exporting the canvas, skip the texture gracefully.
    cached = null;
  }
  return cached;
}
