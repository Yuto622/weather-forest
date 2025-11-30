import React from 'react';
import { WeatherData } from '../types';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, HelpCircle, ExternalLink, Droplets, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  data: WeatherData;
}

const WeatherCard: React.FC<Props> = ({ data }) => {
  const getIcon = (iconType: WeatherData['icon']) => {
    switch (iconType) {
      case 'sunny': return <Sun className="w-14 h-14 text-orange-500 drop-shadow-sm" />;
      case 'cloudy': return <Cloud className="w-14 h-14 text-gray-400 drop-shadow-sm" />;
      case 'rain': return <CloudRain className="w-14 h-14 text-blue-500 drop-shadow-sm" />;
      case 'snow': return <CloudSnow className="w-14 h-14 text-cyan-400 drop-shadow-sm" />;
      case 'thunder': return <CloudLightning className="w-14 h-14 text-yellow-500 drop-shadow-sm" />;
      default: return <HelpCircle className="w-14 h-14 text-gray-300" />;
    }
  };

  const getProviderStyle = (name: string) => {
    const n = name.toLowerCase();
    
    // Yahoo
    if (n.includes('yahoo')) return {
      borderColor: 'border-red-500',
      bgHeader: 'bg-red-50',
      textHeader: 'text-red-700',
      label: 'Yahoo!天気',
      accent: 'text-red-600'
    };
    
    // tenki.jp
    if (n.includes('tenki')) return {
      borderColor: 'border-blue-500',
      bgHeader: 'bg-blue-50',
      textHeader: 'text-blue-700',
      label: 'tenki.jp',
      accent: 'text-blue-600'
    };
    
    // Weathernews
    if (n.includes('weathernews') || n.includes('ウェザーニューズ')) return {
      borderColor: 'border-orange-500',
      bgHeader: 'bg-orange-50',
      textHeader: 'text-orange-700',
      label: 'Weathernews',
      accent: 'text-orange-600'
    };
    
    // JMA
    if (n.includes('jma') || n.includes('気象庁')) return {
      borderColor: 'border-teal-500',
      bgHeader: 'bg-teal-50',
      textHeader: 'text-teal-700',
      label: '気象庁 (JMA)',
      accent: 'text-teal-600'
    };
    
    // NHK
    if (n.includes('nhk')) return {
      borderColor: 'border-indigo-500',
      bgHeader: 'bg-indigo-50',
      textHeader: 'text-indigo-700',
      label: 'NHK 防災',
      accent: 'text-indigo-600'
    };

    // Weather Map
    if (n.includes('map') || n.includes('マップ')) return {
      borderColor: 'border-rose-500',
      bgHeader: 'bg-rose-50',
      textHeader: 'text-rose-700',
      label: 'Weather Map',
      accent: 'text-rose-600'
    };

    // goo Weather
    if (n.includes('goo')) return {
      borderColor: 'border-emerald-500',
      bgHeader: 'bg-emerald-50',
      textHeader: 'text-emerald-700',
      label: 'goo天気',
      accent: 'text-emerald-600'
    };

    // AccuWeather
    if (n.includes('accu')) return {
      borderColor: 'border-amber-500',
      bgHeader: 'bg-amber-50',
      textHeader: 'text-amber-700',
      label: 'AccuWeather',
      accent: 'text-amber-600'
    };

    return {
      borderColor: 'border-gray-300',
      bgHeader: 'bg-gray-50',
      textHeader: 'text-gray-700',
      label: name,
      accent: 'text-gray-600'
    };
  };

  const style = getProviderStyle(data.sourceName);

  return (
    <div className={`relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100`}>
      {/* Colored Top Bar */}
      <div className={`h-1.5 w-full ${style.borderColor.replace('border', 'bg')}`}></div>
      
      {/* Header */}
      <div className={`px-4 py-3 flex justify-between items-center ${style.bgHeader}`}>
        <h3 className={`font-bold ${style.textHeader} text-sm truncate`}>
          {style.label}
        </h3>
        {data.url && (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${style.textHeader} opacity-50 hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-full`}
            title="公式サイトを開く"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      
      {/* Main Content */}
      <div className="p-5 flex-1 flex flex-col items-center justify-between gap-4">
        
        {/* Icon & Condition */}
        <div className="flex flex-col items-center text-center">
          <div className="transform transition-transform duration-300 hover:scale-105">
            {getIcon(data.icon)}
          </div>
          <span className="mt-3 font-bold text-gray-800 text-lg">
            {data.condition}
          </span>
        </div>

        {/* Temps and Rain */}
        <div className="w-full space-y-3">
          
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* High */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-50/50">
              <span className="text-[10px] text-red-400 font-bold uppercase mb-0.5 flex items-center gap-1">
                <ArrowUp size={10} /> High
              </span>
              <span className="text-xl font-bold text-red-600 leading-none">
                {data.highTemp}
              </span>
            </div>
            
            {/* Low */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50/50">
              <span className="text-[10px] text-blue-400 font-bold uppercase mb-0.5 flex items-center gap-1">
                <ArrowDown size={10} /> Low
              </span>
              <span className="text-xl font-bold text-blue-600 leading-none">
                {data.lowTemp}
              </span>
            </div>
          </div>

          {/* Rain */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
             <div className="flex items-center gap-1.5 text-slate-500">
                <Droplets size={14} className="text-blue-500" />
                <span className="text-xs font-bold">降水確率</span>
             </div>
             <span className="text-lg font-bold text-slate-700">{data.rainProb}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WeatherCard;