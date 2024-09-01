import { useState, useRef } from "preact/hooks";
import { DropZone } from "./drop-zone";

function toRgb565({ r, g, b }) {
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function imageDataToCArray(imageData, varName="image", backgroundColor="#ffffff") {
  const backgroundRgb = hexToRgb(backgroundColor);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const cArray = [];
  let cArrayString = `
const uint16_t ${varName}Width = ${width};
const uint16_t ${varName}Height = ${height};

const unsigned short ${varName}[${width * height}] PROGMEM = {\n`;

  for (let y = 0; y < height; y++) {
    let row = "    ";
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const pixelColor = {}
      pixelColor.r = data[i];
      pixelColor.g = data[i + 1];
      pixelColor.b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) {
        pixelColor.r = backgroundRgb.r;
        pixelColor.g = backgroundRgb.g;
        pixelColor.b = backgroundRgb.b;
      }

      const rgb565 = toRgb565(pixelColor);
      cArray.push(rgb565);
      row += `0x${rgb565.toString(16).toUpperCase().padStart(4, "0")}`;
      if (x < width - 1) row += ", ";
    }
    cArrayString += row + ",\n";
  }
  cArrayString = cArrayString.trim().replace(/,\n$/, "\n");
  cArrayString += "\n};";

  return {
    code: cArrayString,
    data: cArray,
    height,
    width,
  };
}

async function getImageDataFromFile(file, canvas) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
  
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function App() {
  const [input, setInput] = useState(null);
  const [output, setOutput] = useState(null);
  const [filename, setFilename] = useState("image");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const canvasRef = useRef();
  const isDownloadDisabled = !output;

  async function onFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageData = await getImageDataFromFile(file, canvasRef.current);
      const output = imageDataToCArray(imageData, filename, backgroundColor);
      setInput(imageData);
      setOutput(output);
    }
  }

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
  }

  const onDownloadClick = (event) => {
    if (!output) {
      event.preventDefault();
    }
  }

  const onNameBlur = (event) => {
    const newFilename = event.target.value.replace(/[^a-zA-Z0-9_\s]/g, "_").replace(/\s+/g, "_") || "image";
    setFilename(newFilename);
    setOutput(imageDataToCArray(input, newFilename, backgroundColor));
  }

  const onBackgroundColorChange = (event) => {
    setBackgroundColor(event.target.value);
    if (input) {
      setOutput(imageDataToCArray(input, filename, event.target.value));
    }
  }

  const disabledClasses = isDownloadDisabled ? "cursor-not-allowed opacity-50" : "";

  return (
    <main className="border-8 border-yellow-300 w-full h-screen overflow-auto">
      <div className="max-w-screen-lg mx-auto px-8">
        <h1 className="inline-block border-8 p-4 border-yellow-300 text-2xl font-mono font-bold w-auto my-8">Image Byte Array Converter</h1>
        <canvas
          ref={canvasRef}
          className="invisible absolute -left-full -top-full"
        />
        <p className="block font-mono py-4">
          This tool converts an image into an Arduino compatible C++ array of 16-bit RGB pixel values. The output array can be used to render the image to displays with the <a className="font-bold hover:underline" href="https://github.com/Bodmer/TFT_eSPI">TFT_eSPI</a> library or similar.
          Transparent pixels will be replaced with the selected background colour.
        </p>
        <details className="block font-mono py-4">
          <summary className="font-bold">Usage with TFT_eSPI</summary>
          <pre className="block whitespace-pre overflow-x-scroll font-mono text-sm p-2 my-4 bg-neutral-800 dark:bg-neutral-900 text-yellow-100 rounded break-words">
            <code>
              #include &lt;TFT_eSPI.h&gt;<br />
              #include "{capitalizeFirstLetter(filename)}.h" // The name of the output file<br />
              <br />
              TFT_eSPI tft = TFT_eSPI();<br />
              <br />
              // Then in the method that updates display to render the image<br />
              tft.push(0, 0, {filename}Width, {filename}Height, {filename}); // The variable names are defined in "{capitalizeFirstLetter(filename)}.h"<br />
              <br />
            </code>
          </pre>
        </details>
        <p className="block font-mono py-4">
          This tool was inspired for and to support the <a className="font-bold hover:underline" href="https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display">CYD (Cheap Yellow Display)</a> community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <DropZone onChange={onFileChange}  />
          <div className="grid grid-cols-1 space-y-2">
            <textarea className="border-4 border-black h-64" readOnly={true} value={(output && output.code) || ""} aria-label="Image code output - readonly"></textarea>
            <label className="py-3 px-0 font-mono font-bold">Name: <input type="text" value={filename} onBlur={onNameBlur} /></label>
            <label className="py-t-3 px-0 font-mono font-bold">Background Colour: <input type="color" id="background-color" name="background-color" value={backgroundColor} onChange={onBackgroundColorChange} /></label>
            <p className="font-mono text-sm">(Transparent pixels will be replaced with selected background colour)</p>
            <div className="flex items-center space-y-2 flex-col md:flex-row md:space-x-2 md:space-y-0">
              <button className={`border-4 border-black p-4 font-mono w-full ${disabledClasses}`} onClick={copyToClipboard}>Copy to clipboard</button>
              <a className={`block text-center border-4 border-black p-4 font-mono w-full ${disabledClasses}`}
                href={`data:text/plain;charset=utf-8,${encodeURIComponent((output && output.code) || "")}`} 
                onClick={onDownloadClick}
                download={`${capitalizeFirstLetter(filename)}.h`}>Download</a>
            </div>
          </div>
        </div>
        <footer className="font-mono py-4">
          <p className="block">Made with 💛 on <a className="font-bold hover:underline" href="https://github.com/jamsinclair/cyd-image-byte-array-converter">@GitHub</a></p>
        </footer>
      </div>
    </main>
  );
}
