
function initQRCodeGeneratorScanner() {
  const qrContainer = document.getElementById("qr-container");

  
  qrContainer.innerHTML = `
    <section class="generator">
      <h2>Generate a QR Code</h2>
      <input id="qr-input" type="text" placeholder="Enter text or URL..." />
      <button id="generate-btn">Generate</button>
      <div id="qrcode"></div>
      <button id="download-btn" class="hidden">Download QR</button>
    </section>

    <section class="scanner">
      <h2>Scan a QR Code (Upload Image)</h2>
      <input id="file-input" type="file" accept="image/*" />
      <p id="scan-result"></p>
    </section>
  `;

  const qrInput = document.getElementById("qr-input");
  const generateBtn = document.getElementById("generate-btn");
  const qrContainerEl = document.getElementById("qrcode");
  const downloadBtn = document.getElementById("download-btn");
  const fileInput = document.getElementById("file-input");
  const resultEl = document.getElementById("scan-result");

  let qrCodeInstance = null;

  generateBtn.addEventListener("click", () => {
    const text = qrInput.value.trim();
    if (!text) {
      alert("Please enter some text or a URL!");
      return;
    }

    qrContainerEl.innerHTML = "";

    qrCodeInstance = new QRCode(qrContainerEl, {
      text,
      width: 200,
      height: 200,
    });

    downloadBtn.classList.remove("hidden");
  });

  downloadBtn.addEventListener("click", () => {
    const img = qrContainerEl.querySelector("img");
    if (!img) {
      alert("Please generate a QR code first!");
      return;
    }

    const link = document.createElement("a");
    link.href = img.src;
    link.download = "qrcode.png";
    link.click();
  });


  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function () {
      const imageDataUrl = reader.result;
      resultEl.textContent = "Scanning...";

      try {
        const result = await scanQRCodeFromImage(imageDataUrl);
        if (result) {
          resultEl.textContent = `Scanned Result: ${result}`;
        } else {
          resultEl.textContent = "No QR code detected.";
        }
      } catch (err) {
        console.error(err);
        resultEl.textContent = "Error scanning QR code.";
      }
    };
    reader.readAsDataURL(file);
  });
}

async function scanQRCodeFromImage(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);


      if (typeof jsQR === "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js";
        script.onload = () => {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(code ? code.data : null);
        };
        script.onerror = () => reject("Failed to load jsQR library.");
        document.body.appendChild(script);
      } else {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        resolve(code ? code.data : null);
      }
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

window.addEventListener("DOMContentLoaded", initQRCodeGeneratorScanner);
