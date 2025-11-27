import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

function FlowDiagram({ diagram, title }) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Render diagram using global mermaid
  useEffect(() => {
    if (!diagram || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for mermaid to be available
        if (!window.mermaid) {
          throw new Error('Mermaid library not loaded');
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await window.mermaid.render(id, diagram);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(`Failed to render diagram: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Small delay to ensure mermaid is loaded
    const timer = setTimeout(renderDiagram, 100);
    return () => clearTimeout(timer);
  }, [diagram]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleReset = () => setScale(1);

  // Export diagram as PNG
  const handleExportPNG = async () => {
    if (!containerRef.current || isExporting) return;

    try {
      setIsExporting(true);
      const svgElement = containerRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('No SVG element found');
      }

      // Clone SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true);
      
      // Get SVG dimensions
      const bbox = svgElement.getBBox();
      const width = bbox.width + 40; // Add padding
      const height = bbox.height + 40;
      
      // Set explicit dimensions on cloned SVG
      clonedSvg.setAttribute('width', width * 2); // 2x for better quality
      clonedSvg.setAttribute('height', height * 2);
      clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Add white background
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', bbox.x - 20);
      rect.setAttribute('y', bbox.y - 20);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);

      // Serialize SVG to string and encode as data URL
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const encodedSvg = encodeURIComponent(svgString);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      
      const img = new Image();
      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Convert to PNG and download
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          
          // Sanitize filename from title
          const filename = (title || 'flow-diagram')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          
          link.href = downloadUrl;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          URL.revokeObjectURL(downloadUrl);
          setIsExporting(false);
        }, 'image/png');
      };
      
      img.onerror = () => {
        setIsExporting(false);
        console.error('Failed to load SVG for export');
      };
      
      img.src = dataUrl;
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title || 'Flow Diagram'}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-500 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={handleExportPNG}
            disabled={isLoading || isExporting}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isLoading || isExporting
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-100 text-blue-600 hover:text-blue-700'
            }`}
            title="Download as PNG"
          >
            <Download size={18} />
            <span className="text-sm font-medium">
              {isExporting ? 'Exporting...' : 'PNG'}
            </span>
          </button>
        </div>
      </div>

      {/* Diagram Container */}
      <div className="diagram-container overflow-auto p-6 min-h-[400px] max-h-[800px] bg-white">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading diagram...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Please check the diagram syntax</p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="mermaid transition-transform duration-200 origin-top-left"
          style={{ 
            transform: `scale(${scale})`,
            display: isLoading ? 'none' : 'block',
          }}
        />
      </div>
    </div>
  );
}

export default FlowDiagram;
