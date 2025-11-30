import React, { useMemo } from 'react';
import { ComparisonResult, WeatherData } from '../types';
import WeatherCard from './WeatherCard';
import { MapPin, Calendar, Info, TrendingUp, Circle } from 'lucide-react';

interface Props {
  data: ComparisonResult;
}

const ComparisonView: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-blue-500" />
            {data.location}
          </h2>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {data.date} Forecast Comparison
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-sm text-gray-400">
          Powered by Gemini • Sources via Google Search
        </div>
      </div>

      {/* Grid of Cards - Adjusted for 8 items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.providers.map((provider, idx) => (
          <WeatherCard key={idx} data={provider} />
        ))}
      </div>

      {/* Temperature Comparison Chart */}
      <TemperatureChart providers={data.providers} />

      {/* Summary Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-3">
          <Info size={20} className="text-indigo-600" />
          AI Analysis & Consensus
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {data.summary || "No summary available."}
        </p>
      </div>

      {/* Source Links */}
      {data.groundingSources.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reference Links</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.groundingSources.map((source, idx) => (
              source.web && (
                <li key={idx}>
                  <a 
                    href={source.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                    title={source.web.title}
                  >
                    {idx + 1}. {source.web.title}
                  </a>
                </li>
              )
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Sub-component: Temperature Chart ---

const TemperatureChart: React.FC<{ providers: WeatherData[] }> = ({ providers }) => {
  const chartData = useMemo(() => {
    return providers.map(p => {
      // Parse "18°" -> 18, handle "-" or invalid
      const high = parseInt(p.highTemp.replace(/[^0-9-]/g, ''), 10);
      const low = parseInt(p.lowTemp.replace(/[^0-9-]/g, ''), 10);
      return {
        name: p.sourceName.replace(/(Weather|Forecast|天気|予報)/g, '').trim().substring(0, 5), // Shorten name
        fullName: p.sourceName,
        high: isNaN(high) ? null : high,
        low: isNaN(low) ? null : low
      };
    });
  }, [providers]);

  const validHighs = chartData.map(d => d.high).filter((n): n is number => n !== null);
  const validLows = chartData.map(d => d.low).filter((n): n is number => n !== null);
  
  // Determine Y-axis domain padding
  const allTemps = [...validHighs, ...validLows];
  const minTemp = allTemps.length ? Math.min(...allTemps) - 2 : 0;
  const maxTemp = allTemps.length ? Math.max(...allTemps) + 2 : 30;
  const tempRange = maxTemp - minTemp || 10;

  // Chart dimensions
  const height = 250;
  const widthPercent = 100; // Used in logic but rendering is % based
  const paddingX = 40;
  const paddingY = 30;

  // Helper to map value to Y coordinate
  const getY = (temp: number | null) => {
    if (temp === null) return height - paddingY; // Fallback
    return height - paddingY - ((temp - minTemp) / tempRange) * (height - paddingY * 2);
  };

  // Helper to map index to X coordinate (as percentage string)
  const getX = (index: number, count: number) => {
    return (index / (count - 1)) * 100;
  };

  // Generate path commands for SVG
  const generatePath = (type: 'high' | 'low') => {
    const points = chartData.map((d, i) => {
      const val = type === 'high' ? d.high : d.low;
      if (val === null) return null;
      // We will render points individually, lines need connections.
      // Since X is %, we can't use simple path string easily without fixed width.
      // But we can use vector-effect: non-scaling-stroke with viewBox. 
      // Instead, let's assume a 1000px coordinate space for ease, then scale down via CSS.
      return { x: (i / (chartData.length - 1)) * 1000, y: getY(val) };
    }).filter(Boolean) as {x: number, y: number}[];

    if (points.length === 0) return '';
    
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  };
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-slate-600" />
          気温予報のばらつき (Temperature Variance)
        </h3>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <span className="text-slate-600">最高気温 (High)</span>
          </div>
          <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
             <span className="text-slate-600">最低気温 (Low)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[250px]">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-8 pl-8 pr-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="w-full border-b border-gray-100 relative h-0">
                <span className="absolute -top-2 -left-8 text-gray-400">
                  {Math.round(maxTemp - (i * (tempRange / 4)))}°
                </span>
             </div>
           ))}
        </div>

        {/* The Chart */}
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none">
          {/* High Line */}
          <path 
            d={generatePath('high')} 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-sm opacity-50"
            vectorEffect="non-scaling-stroke"
          />
          {/* Low Line */}
           <path 
            d={generatePath('low')} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-sm opacity-50"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data Points & Tooltips */}
          {chartData.map((d, i) => {
            const x = (i / (chartData.length - 1)) * 1000;
            const yHigh = d.high !== null ? getY(d.high) : null;
            const yLow = d.low !== null ? getY(d.low) : null;

            return (
              <g key={i}>
                {/* High Point */}
                {yHigh !== null && (
                  <g className="group">
                    <circle cx={x} cy={yHigh} r="6" fill="#ef4444" className="stroke-white stroke-2 shadow-sm transition-all group-hover:r-8" />
                    <text x={x} y={yHigh - 15} textAnchor="middle" fill="#ef4444" className="text-[24px] font-bold" style={{fontSize: '24px'}}>
                      {d.high}°
                    </text>
                  </g>
                )}
                {/* Low Point */}
                {yLow !== null && (
                  <g className="group">
                    <circle cx={x} cy={yLow} r="6" fill="#3b82f6" className="stroke-white stroke-2 shadow-sm transition-all group-hover:r-8" />
                    <text x={x} y={yLow + 30} textAnchor="middle" fill="#3b82f6" className="text-[24px] font-bold" style={{fontSize: '24px'}}>
                      {d.low}°
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* X-axis Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0">
          {chartData.map((d, i) => (
             <div key={i} className="flex-1 text-center">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium truncate block px-1" title={d.fullName}>
                  {d.name}
                </span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;