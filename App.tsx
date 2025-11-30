import React, { useState } from 'react';
import { Search, Loader2, CloudSun, Info } from 'lucide-react';
import { fetchWeatherComparison } from './services/gemini';
import { AppStatus, ComparisonResult } from './types';
import ComparisonView from './components/ComparisonView';

const App: React.FC = () => {
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setStatus(AppStatus.LOADING);
    setError(null);
    setResult(null);

    try {
      const data = await fetchWeatherComparison(location);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError("予報データの取得に失敗しました。もう一度お試しください。");
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setStatus(AppStatus.IDLE); setLocation(''); }}>
            <div className="bg-gradient-to-tr from-sky-500 to-blue-600 p-2 rounded-lg text-white shadow-md">
              <CloudSun size={24} />
            </div>
            <div className="hidden sm:block leading-tight">
              <h1 className="text-lg font-bold tracking-tight text-slate-800">
                8大天気予報<span className="text-blue-600">比較</span>
              </h1>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 relative group">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="地域名 (例: 渋谷、札幌、那覇)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all outline-none shadow-inner text-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          </form>

          <div className="w-8"></div> {/* Spacer for layout balance since map pin is removed */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Welcome State */}
        {status === AppStatus.IDLE && (
          <div className="flex flex-col items-center justify-center mt-12 text-center space-y-8 animate-fade-in-up px-4">
            
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                どの予報を信じますか？
              </h2>
              <p className="text-slate-600 text-lg max-w-lg mx-auto leading-relaxed">
                8つの主要天気予報サイトをAIが一括検索。<br/>
                それぞれの予報を並べて比較できます。
              </p>
            </div>

            {/* Provider Badges */}
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto py-6">
              {[
                { name: 'tenki.jp', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { name: '気象庁 (JMA)', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                { name: 'Weathernews', color: 'text-orange-700 bg-orange-50 border-orange-200' },
                { name: 'NHK 防災', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { name: 'Yahoo! 天気', color: 'text-red-700 bg-red-50 border-red-200' },
                { name: 'Weather Map', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                { name: 'goo天気', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { name: 'AccuWeather', color: 'text-amber-700 bg-amber-50 border-amber-200' },
              ].map(p => (
                <span key={p.name} className={`px-4 py-1.5 rounded-full text-sm font-bold border ${p.color} shadow-sm`}>
                  {p.name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-3xl mt-4">
              {['東京', '大阪', '名古屋', '福岡', '札幌'].map(city => (
                <button
                  key={city}
                  onClick={() => { setLocation(city); }}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 shadow-sm hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-95"
                >
                  {city}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-8">
              <Info size={14} />
              <span>AIエージェントが各サイトを検索して情報を収集します</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {status === AppStatus.LOADING && (
          <div className="flex flex-col items-center justify-center mt-32 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-800">各社の予報を取得中...</h3>
              <p className="text-slate-500">tenki.jp, 気象庁, WN, NHK, Yahoo, 他3社へアクセスしています</p>
            </div>
            
            {/* Fake progress indicators */}
            <div className="flex gap-2 mt-4 opacity-70">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms'}}></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms'}}></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === AppStatus.ERROR && (
          <div className="mt-16 mx-auto max-w-md bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudSun className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">取得失敗</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => setStatus(AppStatus.IDLE)}
              className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              もう一度試す
            </button>
          </div>
        )}

        {/* Success State */}
        {status === AppStatus.SUCCESS && result && (
          <ComparisonView data={result} />
        )}
      </main>
    </div>
  );
};

export default App;