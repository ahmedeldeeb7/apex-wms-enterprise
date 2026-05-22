import React from 'react';
import { Download, Check } from 'lucide-react';

const Barcode = ({ value = '100000000001', label = '' }) => {
  const [downloaded, setDownloaded] = React.useState(false);

  // Generate alternating thickness values simulating standard Code 128 layouts
  const generatePattern = (val) => {
    const seed = parseInt(val, 10) || 123456789;
    const binStr = (seed * 192837).toString(2).substring(0, 32);
    return binStr.split('').map(char => char === '1' ? 3 : 1);
  };

  const pattern = generatePattern(value);

  const downloadBarcodeSVG = () => {
    const svgElement = document.getElementById(`barcode-${value}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `APEX-BARCODE-${value}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-4 border border-white/5 rounded-xl bg-white/5">
      <div className="text-[10px] font-mono tracking-widest text-cyan-400 mb-2 uppercase font-bold">
        {label || 'Product Stock ID'}
      </div>
      
      {/* Dynamic SVG Barcode Blocks */}
      <svg
        id={`barcode-${value}`}
        width="160"
        height="70"
        className="bg-white p-2 rounded"
        viewBox="0 0 160 70"
      >
        <g fill="black">
          {pattern.map((width, idx) => {
            // Alternating spaces and bar colors
            if (idx % 2 === 0) {
              const xPos = pattern.slice(0, idx).reduce((sum, w) => sum + w, 0) * 1.5 + 10;
              return (
                <rect
                  key={idx}
                  x={xPos}
                  y="5"
                  width={width * 1.5}
                  height="45"
                />
              );
            }
            return null;
          })}
        </g>
        <text
          x="80"
          y="62"
          textAnchor="middle"
          fill="black"
          fontSize="9"
          fontFamily="monospace"
          letterSpacing="2"
        >
          {value}
        </text>
      </svg>

      {/* Action buttons */}
      <button
        onClick={downloadBarcodeSVG}
        className="flex items-center gap-1.5 mt-3 px-3 py-1.5 text-[10px] font-semibold tracking-wider rounded border border-white/10 text-white/50 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all uppercase"
      >
        {downloaded ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            Downloaded
          </>
        ) : (
          <>
            <Download className="w-3 h-3" />
            Export Label
          </>
        )}
      </button>
    </div>
  );
};

export default Barcode;
export { Barcode };
