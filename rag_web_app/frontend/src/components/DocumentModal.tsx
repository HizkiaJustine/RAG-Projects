import { useState } from 'react';
import { X, FileText, Link as LinkIcon, Upload, Loader2 } from 'lucide-react';
import { ingestPdf, ingestUrls } from '../services/api';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentModal({ isOpen, onClose }: DocumentModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleUpload = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (activeTab === 'pdf' && file) {
        await ingestPdf(file);
        setMessage({ text: 'PDF successfully processed!', type: 'success' });
        setFile(null);
      } else if (activeTab === 'url' && urlInput.trim()) {
        const urls = urlInput.split(',').map(url => url.trim());
        await ingestUrls(urls);
        setMessage({ text: 'URLs successfully processed!', type: 'success' });
        setUrlInput('');
      }
    } catch (error) {
      setMessage({ text: String(error), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#202123] rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200">Manage Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2">
          <button 
            onClick={() => { setActiveTab('pdf'); setMessage({ text: '', type: '' }); }}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pdf' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <FileText size={16} /> Upload PDF
          </button>
          <button 
            onClick={() => { setActiveTab('url'); setMessage({ text: '', type: '' }); }}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <LinkIcon size={16} /> Add URLs
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 pt-0">
          {activeTab === 'pdf' ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="pdf-upload" 
              />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <Upload size={32} className="text-gray-400 mb-3" />
                <span className="text-sm text-gray-300 font-medium">
                  {file ? file.name : 'Click to browse PDF file'}
                </span>
                <span className="text-xs text-gray-500 mt-1">Maximum size: 10MB</span>
              </label>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Enter URLs (comma separated):</label>
              <textarea 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com, https://another.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-h-[100px]"
              />
            </div>
          )}

          {/* Status Message */}
          {message.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
              {message.text}
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleUpload}
            disabled={isLoading || (activeTab === 'pdf' ? !file : !urlInput.trim())}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:bg-gray-700"
          >
            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Upload & Process'}
          </button>
        </div>

      </div>
    </div>
  );
}