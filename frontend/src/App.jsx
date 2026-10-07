import React, { useState } from 'react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles([...files, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length || !question) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('question', question);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ refuse_reason: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans p-8 font-[Inter]">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">ProofAnalyst</h1>
          <p className="text-[#888] mt-2">Data quality scanner and sandbox analysis.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className="border-2 border-dashed border-[#2a2a2a] bg-[#111] p-12 text-center rounded-xl hover:border-[#555] transition-colors relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <p className="text-[#888]">Drag & drop CSV files here, or click to select</p>
            <input 
              type="file" 
              multiple 
              onChange={handleFileSelect} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {files.map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-[#222] rounded-full text-sm">{f.name}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <textarea
              className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white focus:outline-none focus:border-white transition-colors"
              rows="3"
              placeholder="Ask a question about the data..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !files.length || !question}
            className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : 'Analyze'}
          </button>
        </form>

        {result && (
          <div className="animate-[fadeup_0.3s_ease-out]">
            {result.refuse_reason ? (
              <div className="bg-[#111] border border-red-500/50 rounded-xl p-6">
                <h2 className="text-red-500 font-bold mb-2">Request Refused</h2>
                <p className="text-[#888]">{result.refuse_reason}</p>
              </div>
            ) : (
              <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Analysis Result</h2>
                    <p className="text-lg">{result.answer}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                    result.confidence === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.confidence} Confidence
                  </span>
                </div>

                {result.caveats && result.caveats.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Caveats & Warnings</h3>
                    <ul className="list-disc list-inside text-[#555] space-y-1">
                      {result.caveats.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <div className="space-y-2 relative group">
                  <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Executed Code</h3>
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 font-[JetBrains_Mono] text-sm overflow-x-auto">
                    <pre className="text-gray-300">
                      <code>{result.code}</code>
                    </pre>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(result.code)}
                    className="absolute top-8 right-2 p-2 bg-[#222] hover:bg-[#333] rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    Copy
                  </button>
                </div>
                
                {result.stdout && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Sandbox Output</h3>
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 font-[JetBrains_Mono] text-sm text-gray-400">
                      <pre><code>{result.stdout}</code></pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
