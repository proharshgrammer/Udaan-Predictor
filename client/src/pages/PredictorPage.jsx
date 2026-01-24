import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Loader2, Download, AlertTriangle, CheckCircle, Info, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PredictorPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const counselingType = searchParams.get('type') || 'JoSAA'; // Default to JoSAA

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rank: '',
    category: 'OPEN',
    quota: 'AI',
    gender: 'Gender-Neutral',
    counselling_type: counselingType,
    exam_type: 'JEE Main' // Default
  });
  const [results, setResults] = useState([]);

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      counselling_type: counselingType,
      // Default to JEE Advanced if JoSAA (Actually JoSAA can be both, but user wants toggle. Let's default Main)
      exam_type: counselingType === 'JoSAA' ? 'JEE Advanced' : 'JEE Main' 
    }));
  }, [counselingType]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Toggle Helper
  const setExamType = (type) => {
    setFormData(prev => ({ ...prev, exam_type: type }));
  };

  const [sortBy, setSortBy] = useState('chance'); // chance, cutoff_low, cutoff_high

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // ... (getSortedResults remains same) 

  const getSortedResults = () => {
    const sorted = [...results];
    switch (sortBy) {
      case 'chance':
        // High Probability First
        return sorted.sort((a, b) => b.prediction.probability - a.prediction.probability);
      case 'cutoff_low':
        // Lower Cutoff First (Harder/Better colleges)
        return sorted.sort((a, b) => a.prediction.expected_cutoff - b.prediction.expected_cutoff);
      case 'cutoff_high':
        // Higher Cutoff First (Easier colleges)
        return sorted.sort((a, b) => b.prediction.expected_cutoff - a.prediction.expected_cutoff);
      default:
        return sorted;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.predict(formData);
      setResults(data);
      setStep(2);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['College', 'Type', 'Branch', 'Category', 'Quota', 'Your Rank', 'Expected Cutoff', 'Probability', 'Chance'];
    const rows = results.map(r => [
      r.college,
      r.college_type || 'N/A', // Add College Type
      r.branch,
      formData.category,
      formData.quota,
      formData.rank,
      r.prediction.expected_cutoff,
      `${r.prediction.probability}%`,
      r.prediction.band
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prediction_results.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getBandColor = (band) => {
    switch (band) {
      case 'Safe': return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      case 'Moderate': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Risky': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {step === 1 && (
        <div className="max-w-xl mx-auto">
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/counselling')} className="mr-2 px-1">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold flex-1 text-center pr-8">
                 {counselingType === 'Multi' ? 'Multi-Counselling' : `${counselingType} Predictor`}
              </h2>
            </div>
            <p className="text-center text-slate-500 mb-6 -mt-4">Enter your details to find your best college options</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Exam Type Toggle (Only for JoSAA) */}
              {counselingType === 'JoSAA' && (
                <div className="bg-slate-100 p-1 rounded-xl flex">
                  <button
                    type="button"
                    onClick={() => setExamType('JEE Main')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      formData.exam_type === 'JEE Main' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    JEE Main
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamType('JEE Advanced')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      formData.exam_type === 'JEE Advanced' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    JEE Advanced
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Entrance Rank</label>
                <Input 
                  name="rank" 
                  type="number" 
                  required 
                  placeholder="e.g. 15000" 
                  value={formData.rank}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Category</label>
                  <select 
                    name="category" 
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-800"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="GEN-EWS">EWS</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Quota</label>
                  <select 
                    name="quota" 
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-800"
                    value={formData.quota}
                    onChange={handleChange}
                  >
                    <option value="AI">All India (AI)</option>
                    <option value="HS">Home State (HS)</option>
                    <option value="OS">Other State (OS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Gender</label>
                <select 
                  name="gender" 
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-800"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Gender-Neutral">Gender-Neutral</option>
                  <option value="Female-Only">Female-Only</option>
                </select>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                Predict My Colleges
              </Button>
            </form>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold">Prediction Results</h1>
              <p className="text-slate-500">
                Based on Rank {formData.rank} ({formData.category}) 
                {formData.exam_type && ` - ${formData.exam_type}`}
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0 items-center">
               <div className="flex items-center space-x-2">
                 <span className="text-sm text-slate-500">Sort By:</span>
                 <select 
                   value={sortBy} 
                   onChange={handleSortChange} 
                   className="h-9 rounded-lg border border-slate-200 bg-white text-sm px-3 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-800"
                 >
                   <option value="chance">Best Chance</option>
                   <option value="cutoff_low">Cutoff (Low-High)</option>
                   <option value="cutoff_high">Cutoff (High-Low)</option>
                 </select>
               </div>
               <Button variant="outline" onClick={() => setStep(1)} size="sm">Modify</Button>
               <Button onClick={exportCSV} variant="secondary" size="sm">
                 <Download className="mr-2 h-4 w-4" /> Export
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Info className="mx-auto h-10 w-10 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No colleges found</h3>
                <p className="text-slate-500">Try adjusting your filters or category.</p>
              </div>
            ) : (
              getSortedResults().map((item, idx) => (
                <Card key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 hover:border-indigo-500/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                       {/* Badge for Counselling Type if Multi */}
                       {(counselingType === 'Multi' || item.counselling_type) && (
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                           {item.counselling_type}
                         </span>
                       )}
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", getBandColor(item.prediction.band))}>
                        {item.prediction.band}
                      </span>
                      <span className="text-sm font-mono text-slate-500">Prob: <span className="font-bold text-indigo-600">{item.prediction.probability}%</span></span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.college}</h3>
                    <p className="text-teal-600 font-medium">{item.branch}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-slate-500">
                      <span>Exp. Cutoff: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.prediction.expected_cutoff}</span></span>
                      <span>Volatility (σ): <span className="font-mono text-slate-700 dark:text-slate-300">{item.prediction.sigma}</span></span>
                      {item.latest_cutoff && (
                        <>
                           <span className="hidden md:inline text-slate-300">|</span>
                           <span>Last Year: <span className="font-mono text-slate-700 dark:text-slate-300">{item.latest_cutoff.closing_rank}</span> <span className="text-xs text-slate-400">(Round {item.latest_cutoff.round})</span></span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Mini Visual Bar */}
                  <div className="w-full md:w-64 mt-4 md:mt-0 h-16">
                     <div className="flex justify-between text-xs text-slate-400 mb-1">
                       <span>Chance</span>
                       <span>{item.prediction.probability}%</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={cn("h-full rounded-full transition-all duration-1000", 
                           item.prediction.band === 'Safe' ? 'bg-teal-500' : 
                           item.prediction.band === 'Moderate' ? 'bg-yellow-500' : 'bg-orange-500'
                         )}
                         style={{ width: `${item.prediction.probability}%` }}
                       />
                     </div>
                     <p className="text-xs text-slate-400 mt-2 text-right">
                       {item.history.length < 2 ? 'Limited Data' : 'Based on 3y Trend'}
                     </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictorPage;
