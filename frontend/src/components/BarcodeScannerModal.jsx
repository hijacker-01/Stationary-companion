import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from "lucide-react";

export default function BarcodeScannerModal({ onClose, onScan }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    }, false);

    scanner.render(
      (text) => {
        scanner.clear();
        onScan(text);
      },
      (err) => {
        // Ignore minor errors (frame not found)
        if (!err.includes("NotFound")) {
          console.warn(err);
        }
      }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-[#1b4985] text-white p-3 font-bold flex justify-between items-center">
          <span className="flex items-center"><Camera className="w-4 h-4 mr-2"/> Scan Barcode / QR</span>
          <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 bg-gray-50 flex-1">
          <div id="reader" className="w-full bg-black rounded overflow-hidden"></div>
          {error && <div className="text-red-500 text-xs mt-2 font-bold">{error}</div>}
          <div className="text-center text-xs text-gray-500 mt-3">Point camera at item barcode</div>
        </div>
      </div>
    </div>
  );
}
