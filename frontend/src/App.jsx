import { useState, useRef } from 'react';

// Icons
const IconFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
  </svg>
);

const IconSpinner = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,104v40a8,8,0,0,0,16,0V104a8,8,0,0,0-16,0Zm8,88a12,12,0,1,0-12-12A12,12,0,0,0,128,192Z"/>
  </svg>
);

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"/>
  </svg>
);

function App() {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCopy = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !question.trim()) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("question", question);
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setResult({
        confidence: "Refused",
        refuse_reason: "Network error: " + e.message,
        caveats: []
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans antialiased selection:bg-[#2a2a2a] selection:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-2xl mx-auto py-16 px-6 md:px-8 flex flex-col gap-10">
        
        {/* HEADER */}
        <header className="flex flex-col items-center text-center space-y-3">
          <div className="w-10 h-10 grid grid-cols-2 gap-1 mb-2">
            <div className="bg-[#ededed] rounded-sm"></div>
            <div className="bg-[#666666] rounded-sm"></div>
            <div className="bg-[#333333] rounded-sm"></div>
            <div className="bg-[#ededed] rounded-sm"></div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">ProofAnalyst</h1>
          <p className="text-[#666666] text-sm">Data quality scanner and sandbox analysis.</p>
        </header>

        {/* UPLOAD ZONE */}
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="sr-only">Upload Files</h2>
          <div 
            role="button"
            tabIndex={0}
            aria-label="Upload CSV or JSON files"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative flex flex-col w-full min-h-[120px] rounded-[12px] bg-[#111111] 
              border transition-all duration-150 ease-out p-6 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
              ${dragging ? 'border-white bg-[#141414] scale-[1.01]' : 'border-[#1e1e1e] hover:border-[#2a2a2a]'}
            `}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept=".csv,.json"
              onChange={handleFileChange}
              className="sr-only" 
            />

            {files.length === 0 ? (
              <div className="m-auto flex flex-col items-center text-center gap-3 pointer-events-none">
                <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666666]">
                  <IconUpload />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#ededed]">Drag & drop CSV files here</p>
                  <p className="text-sm text-[#666666]">or click to browse</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md pl-3 pr-1 py-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[#666666]"><IconFile /></span>
                      <span className="text-sm text-[#ededed] max-w-[140px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        aria-label={`Remove ${f.name}`}
                        className="text-[#666666] hover:text-white transition-colors p-1.5 -m-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <IconX />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#666666] hover:text-white transition-colors self-start inline-block">
                  + Add more files
                </p>
              </div>
            )}
          </div>
        </section>

        {/* QUERY SECTION */}
        <section aria-labelledby="query-heading" className="flex flex-col gap-2">
          <h2 id="query-heading" className="text-xs font-semibold uppercase tracking-widest text-[#666666]">
            Query
          </h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the data..."
            aria-label="Ask a question about the data"
            rows={3}
            className="w-full resize-none rounded-[8px] bg-[#111111] border border-[#1e1e1e] p-4 text-sm text-[#ededed] placeholder:text-[#333333] transition-colors focus:outline-none focus:border-white focus-visible:ring-0"
          />
          <p className="text-xs text-[#333333] mt-1">Ctrl + Enter to submit</p>
        </section>

        {/* SUBMIT BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || !question.trim() || loading}
          aria-disabled={files.length === 0 || !question.trim() || loading}
          className={`
            flex items-center justify-center gap-2 w-full h-[44px] rounded-[8px] text-sm font-medium transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
            ${(files.length === 0 || !question.trim() || loading) 
              ? 'bg-[#1a1a1a] text-[#666666] cursor-not-allowed border border-[#1e1e1e]' 
              : 'bg-white text-black hover:bg-[#e6e6e6]'
            }
          `}
        >
          {loading ? (
            <>
              <IconSpinner />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>

        {/* RESULTS PANEL */}
        <div aria-live="polite" className="mt-2 min-h-[200px]">
          {result && (
            <div 
              className="animate-[fadeup_200ms_ease-out] rounded-[12px] bg-[#111111] border border-[#1e1e1e] overflow-hidden"
            >
              {result.confidence === "Refused" || result.refuse_reason ? (
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#1a0505] border border-[#3f0f0f] px-2.5 py-1 text-xs font-bold text-[#f87171] uppercase tracking-wide">
                      Refused
                    </span>
                  </div>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    {result.refuse_reason}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Section 1: Result Header */}
                  <div className="px-6 py-4 border-b border-[#1e1e1e] flex items-center justify-between bg-[#141414]">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Result</h3>
                    
                    {result.confidence === "High" && (
                      <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0d2b1d] border border-[#166534] px-2 py-0.5 text-xs font-medium text-[#4ade80]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" aria-hidden="true"></span>
                        HIGH
                      </span>
                    )}
                    {result.confidence === "Medium" && (
                      <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2b1f0d] border border-[#92400e] px-2 py-0.5 text-xs font-medium text-[#fbbf24]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" aria-hidden="true"></span>
                        MEDIUM
                      </span>
                    )}
                    {result.confidence === "Low" && (
                      <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2b0d0d] border border-[#991b1b] px-2 py-0.5 text-xs font-medium text-[#f87171]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" aria-hidden="true"></span>
                        LOW
                      </span>
                    )}
                  </div>

                  {/* Section 2: Answer Value */}
                  <div className="px-6 py-6 border-b border-[#1e1e1e]">
                    <p className={`text-2xl font-medium text-white ${
                      /^[-+]?\d*\.?\d+$/.test(result.answer.trim().replace(/,/g, '')) ? 'font-mono tracking-tight' : 'font-sans'
                    }`} style={/^[-+]?\d*\.?\d+$/.test(result.answer.trim().replace(/,/g, '')) ? { fontFamily: 'JetBrains Mono, monospace' } : {}}>
                      {result.answer}
                    </p>
                  </div>

                  {/* Section 3: Verification Code */}
                  {result.code && (
                    <div className="flex flex-col border-b border-[#1e1e1e]">
                      <div className="px-6 py-3 flex items-center justify-between border-b border-[#1e1e1e] bg-[#141414]">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Verification Code</h4>
                        <button
                          onClick={handleCopy}
                          aria-label="Copy verification code"
                          className="text-xs font-medium text-[#666666] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1.5 -m-1.5"
                        >
                          {copied ? <span className="text-[#4ade80]">Copied ✓</span> : "Copy"}
                        </button>
                      </div>
                      <div className="p-4 bg-[#0a0a0a] max-h-[224px] overflow-y-auto">
                        <pre className="text-xs text-[#94a3b8] font-mono leading-relaxed overflow-x-auto whitespace-pre" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          <code>{result.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Section 4: Caveats */}
                  {result.caveats && result.caveats.length > 0 && (
                    <div className="px-6 py-5 bg-[#141414]">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[#fbbf24]"><IconWarning /></span>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Caveats</h4>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {result.caveats.map((caveat, idx) => (
                          <li key={idx} className="text-sm text-[#666666] flex gap-2">
                            <span className="select-none">—</span>
                            <span>{caveat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
