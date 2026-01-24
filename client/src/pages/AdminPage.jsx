import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { UploadCloud, FileText, CheckCircle, XCircle, Trash2, Clock, FileSpreadsheet } from 'lucide-react';

const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [counsellingType, setCounsellingType] = useState(''); 
  const [counsellingTypes, setCounsellingTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const historyData = await api.getHistory(token);
        setHistory(historyData);
        
        const typesData = await api.getCounsellingTypes(token);
        setCounsellingTypes(typesData);
        if (typesData.length > 0) {
          setCounsellingType(typesData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await api.getHistory(token);
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const token = localStorage.getItem('token');
      const res = await api.uploadCSV(file, counsellingType, token);
      setStatus({ type: 'success', message: `Successfully processed ${res.stats.success} records.` });
      setFile(null); // Clear file input
      fetchHistory(); // Refresh table
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all rank data associated with this upload.')) return;
    try {
      const token = localStorage.getItem('token');
      await api.deleteHistory(id, token);
      fetchHistory();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold font-heading mb-6">Import Data</h1>
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-indigo-600" /> 
              Upload CSV
            </h2>
            
            {status && (
              <div className={`p-3 rounded-lg mb-4 text-sm flex items-center ${status.type === 'success' ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}>
                {status.type === 'success' ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                {status.message}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wide text-slate-500">Counselling Type</label>
                <select 
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={counsellingType}
                  onChange={(e) => setCounsellingType(e.target.value)}
                >
                  {counsellingTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 truncate px-2">{file ? file.name : "Select CSV"}</p>
                <p className="text-xs text-slate-400 mt-1">Max 50MB</p>
              </div>

              <Button type="submit" disabled={!file} isLoading={loading} className="w-full">
                Upload Data
              </Button>
            </form>
          </Card>
        </div>

        {/* History Column */}
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold font-heading mb-6">Upload History</h1>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">File Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Records</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                        No uploads yet. Import a file to get started. // This message will appear initially.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                          <FileSpreadsheet className="h-4 w-4 mr-2 text-teal-600" />
                          <div>
                            <div className="font-bold">{item.counselling_name}</div>
                            <div className="text-xs text-slate-500">{item.filename}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1.5" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {item.record_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete Batch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
