import { useState, useRef, useEffect } from 'react';
import { Menu, Plus, MessageSquare, Settings, UploadCloud, User, Bot, Loader2 } from 'lucide-react';
import { queryChatbot } from './services/api';
import DocumentModal from './components/DocumentModal';

// Mendefinisikan struktur data pesan
interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sources?: string[];
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // State untuk chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Referensi untuk auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fungsi auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue(''); // Kosongkan input
    
    // 1. Tambahkan pesan user ke layar
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // 2. Kirim ke backend (FastAPI)
      const response = await queryChatbot(userText);
      
      // 3. Tambahkan jawaban bot ke layar
      const newBotMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        text: response.answer,
        sources: response.sources 
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        text: "I apologize, but I encountered an error communicating with the server. Please make sure the backend is running." 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Menangani tombol Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-chat-bg text-gray-100 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 transition-all duration-300 ease-in-out bg-[#202123] overflow-hidden flex flex-col`}>
        <div className="p-3">
          <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-800 transition-colors border border-gray-600 text-sm">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-gray-400 mb-3 font-semibold">Recent</div>
          <button className="flex items-center gap-3 w-full p-3 rounded-md bg-gray-800 transition-colors text-sm text-left overflow-hidden">
            <MessageSquare size={16} className="flex-shrink-0" />
            <span className="truncate">Current Session</span>
          </button>
        </div>
        <div className="p-3 border-t border-gray-700 flex flex-col gap-1">
          <button onClick={() => setIsDocModalOpen(true)}
          className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300">
            <UploadCloud size={16} /> Manage Documents
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300">
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative">
        
        <div className="flex items-center p-3 text-gray-200 border-b border-gray-700/50 bg-chat-bg z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-700 rounded-md transition-colors">
            <Menu size={20} />
          </button>
          <span className="ml-3 font-medium">Chatbot RAG</span>
        </div>

        {/* Area Pesan */}
        <div className="flex-1 overflow-y-auto pb-32">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4">
                    <div className="bg-gray-600/20 p-4 rounded-2xl mb-4">
                      <MessageSquare size={40} className="text-gray-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-200">How can I help you today?</h1>
                </div>
            ) : (
                <div className="flex flex-col w-full max-w-3xl mx-auto px-4 py-6 gap-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>
                            
                            {/* Kotak Pesan */}
                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#40414F] text-gray-100 rounded-tr-none' : 'bg-transparent text-gray-100 border border-gray-700 rounded-tl-none'}`}>
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                </div>
                                
                                {/* Menampilkan Sumber Referensi jika ada */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-md border border-gray-700 inline-block">
                                        <span className="font-semibold text-gray-300">Sources:</span>
                                        <ul className="list-disc list-inside mt-1">
                                            {msg.sources.map((src, idx) => (
                                                <li key={idx} className="truncate max-w-xs md:max-w-md">{src}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Indikator Loading */}
                    {isLoading && (
                        <div className="flex gap-4 flex-row">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={18} />
                            </div>
                            <div className="flex items-center p-4">
                                <Loader2 size={20} className="animate-spin text-gray-400" />
                                <span className="ml-3 text-gray-400 text-sm animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Area Input Chat */}
        <div className="p-4 w-full max-w-3xl mx-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-chat-bg via-chat-bg to-transparent pt-10">
            <div className="relative flex items-center bg-[#40414F] rounded-xl border border-gray-600 shadow-md">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder={isLoading ? "Please wait..." : "Message RAG Bot..."}
                    className="w-full bg-transparent text-white p-4 pr-12 rounded-xl focus:outline-none disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-3 p-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white disabled:opacity-50 disabled:bg-gray-600"
                >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
            <div className="text-xs text-gray-400 text-center mt-3 pb-2">
                RAG Bot can make mistakes. Consider verifying important information.
            </div>
        </div>

      </div>

      <DocumentModal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
      />
    </div>
  );
}

export default App;