import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

function FlowDiagram({ diagram, title }) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);

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
