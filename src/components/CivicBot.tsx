import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageSquare, ArrowRight, ShieldAlert, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

export default function CivicBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "Namaste! I am Nagrik Shastra, your Civic AI Grievance Assistant. I can help you understand municipal bylaws, craft formal escalations, file RTI requests, or figure out which municipal ward department is responsible for specific public assets. How can I serve your community today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const starterQuestions = [
    { text: "RTI filing procedure", prompt: "Could you walk me through the steps to draft and file a Right to Information (RTI) application for local municipal expenditure?" },
    { text: "Who maintains streetlights?", prompt: "Which municipal ward department handles defective streetlights and public dark spots in Indian metro cities?" },
    { text: "Waste management laws 2016", prompt: "What are the key legal duties of municipal corporations under the Solid Waste Management Rules 2016?" },
    { text: "Pothole compensation rules", prompt: "Are there any High Court rulings or compensation guidelines for citizens affected by municipal pothole negligence?" }
  ];

  // Auto-scroll to bottom of the message container on new messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Map chat messages format for server
      const chatHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/civic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          chatHistory: chatHistory
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || 'Server responded with an error');
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `⚠️ Offline State Note: ${err.message || 'Connecting server failed'}. If you are in development workspace, verify that the dev server is active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[600px] h-auto max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Informative Side Panel */}
      <div className="lg:w-1/3 lg:h-full flex flex-col gap-5">
        <div className="bg-gradient-to-br from-navy to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4"></div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-xl bg-saffron/10 text-saffron inline-flex">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <h3 className="font-display font-semibold text-lg text-white">Nagrik Shastra AI</h3>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed mb-4">
            A state-of-the-art server-side LLM agent trained on the Indian legal framework, municipal charters (BMC, BBMP, MCD), and public service accountability structures.
          </p>
          <div className="space-y-3 border-t border-slate-700/60 pt-4 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
              <span>Reference laws like the **RTI Act 2005** or **Municipal Solid Waste Rules 2016** seamlessly.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Understand your fundamental rights regarding motorable roads and public light maintenance.</span>
            </div>
          </div>
        </div>

        {/* Quick-Prompt Suggestions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex-1">
          <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-400 mb-3.5">Frenquently Asked Civic Topics</h4>
          <div className="space-y-2.5">
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.prompt)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-navy/20 hover:bg-slate-50 transition-all text-xs text-slate-700 font-medium group flex items-center justify-between"
              >
                <span>{q.text}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Conversation Engine */}
      <div className="lg:w-2/3 h-[500px] lg:h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900">Live Civic Advisory Console</h4>
            <span className="text-[10px] text-slate-400 font-mono">MODEL: GEMINI-2.5-FLASH</span>
          </div>
        </div>

        {/* Message Area */}
        <div ref={messageContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.map((m, index) => (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold shadow-inner ${
                m.role === 'user' ? 'bg-navy text-white' : 'bg-saffron/15 text-saffron border border-saffron/20'
              }`}>
                {m.role === 'user' ? 'C' : 'N'}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-navy/5 text-slate-800 rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none font-medium'
              }`}>
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-navy">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-sm font-extrabold text-navy mt-3 mb-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xs font-bold text-navy mt-2 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-800 mt-2 mb-1">{children}</h3>,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="text-[9px] text-slate-400 mt-1.5 text-right font-mono">{m.timestamp}</div>
              </div>
            </div>
          ))}

          {/* AI Loader */}
          {isLoading && (
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-saffron/15 text-saffron border border-saffron/20 flex items-center justify-center animate-bounce">
                N
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="p-4 border-t border-slate-100 flex gap-3.5 bg-slate-50/50"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about RTI drafts, municipal duties, street bylaws..."
            disabled={isLoading}
            className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy disabled:bg-slate-50 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy-hover transition-colors shadow-sm cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
