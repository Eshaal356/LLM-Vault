import React, { useState, useRef } from 'react';
import { scanFile, calculateHash } from './services/geminiService';
import { QueuedFile, AuditLogEntry, SafetyStatus } from './types';
import { FileCard } from './components/FileCard';
import { PromptFirewall } from './components/PromptFirewall';
import { OutputGuard } from './components/OutputGuard';
import { AuditLog } from './components/AuditLog';
import { SystemMonitor } from './components/SystemMonitor';
import { ModelHardening } from './components/ModelHardening';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from './constants';

function App() {
  const [activeTab, setActiveTab] = useState<'system' | 'input' | 'files' | 'model' | 'output' | 'audit'>('input');
  
  // File System State
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit System State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemActive, setSystemActive] = useState(true);

  // Helper: Add Log
  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    if (!systemActive) return; // Kill switch logic
    const newLog: AuditLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...entry
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  // --- File Processing Logic ---
  const processFiles = async (files: File[]) => {
    if (!systemActive) {
        alert("System Kill-Switch Active. Operations Halted.");
        return;
    }

    const newQueueItems: QueuedFile[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      status: 'pending'
    }));

    setQueue(prev => [...prev, ...newQueueItems]);

    for (const item of newQueueItems) {
      if (item.file.size > MAX_FILE_SIZE_BYTES) {
        updateQueueItem(item.id, { status: 'error', errorMsg: 'File exceeds 10MB limit.' });
        addAuditLog({
            module: 'File',
            action: 'Upload Rejected',
            status: SafetyStatus.WARNING,
            details: `Size limit exceeded: ${item.file.name}`,
            hash: 'N/A'
        });
        continue;
      }

      try {
        updateQueueItem(item.id, { status: 'scanning' });
        const hash = await calculateHash(item.file);
        
        // Context Integrity Check: Provenance
        addAuditLog({
            module: 'File',
            action: 'Hash Calculation',
            status: SafetyStatus.SAFE,
            details: `Calculated SHA-256 for ${item.file.name}`,
            hash: hash
        });

        const result = await scanFile(item.file, hash);
        updateQueueItem(item.id, { status: 'complete', result });

        addAuditLog({
            module: 'File',
            action: 'Scan Complete',
            status: result.poisoned ? SafetyStatus.DANGER : SafetyStatus.SAFE,
            details: result.reason,
            hash: hash
        });

      } catch (err: any) {
        updateQueueItem(item.id, { status: 'error', errorMsg: err.message || 'Scanner hiccup.' });
      }
    }
  };

  const updateQueueItem = (id: string, updates: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const generateReport = () => {
    const md = `# LLM-Vault Incident Report
    
**Date:** ${new Date().toLocaleString()}
**System Status:** ${systemActive ? 'ACTIVE' : 'KILL-SWITCH ENGAGED'}
**Total Scans:** ${auditLogs.length}

## Recent Incidents
${auditLogs.filter(l => l.status === SafetyStatus.DANGER).map(l => 
  `- [${new Date(l.timestamp).toLocaleTimeString()}] **${l.module}**: ${l.details}`
).join('\n')}

## Compliance
- Data Privacy: Presidio PII Detection Active
- Supply Chain: SHA-256 Verification Active
- Output Guard: Toxicity Filter Active
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incident-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getHeaderInfo = () => {
    switch(activeTab) {
      case 'system': return { title: 'System & Hardware Security', subtitle: 'Monitor infrastructure, network status, and resource usage.' };
      case 'input': return { title: 'Input-Side Defense', subtitle: 'Pre-flight checks for prompt injection and jailbreaks.' };
      case 'files': return { title: 'Data & File Security', subtitle: 'Scan datasets for poisoning and adversarial attacks.' };
      case 'model': return { title: 'Model Hardening', subtitle: 'Red teaming, sandbox execution, and adversarial defense.' };
      case 'output': return { title: 'Output Guardrails', subtitle: 'Validate model responses for PII, malware, and toxicity.' };
      case 'audit': return { title: 'Logging & Recovery', subtitle: 'Immutable ledger of all security events and backups.' };
      default: return { title: '', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                 <i className="fas fa-shield-virus text-white text-xl"></i>
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">LLM-Vault</h1>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Enterprise Ed.</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
           <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infrastructure</div>
           <SidebarButton 
             active={activeTab === 'system'} 
             onClick={() => setActiveTab('system')} 
             icon="fa-server" 
             label="System Health" 
             sub="Hardware & Net"
           />
           
           <div className="px-3 pb-2 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Defenses</div>
           <SidebarButton 
             active={activeTab === 'input'} 
             onClick={() => setActiveTab('input')} 
             icon="fa-bolt" 
             label="Input Defense" 
             sub="Prompt Firewall"
           />
           <SidebarButton 
             active={activeTab === 'files'} 
             onClick={() => setActiveTab('files')} 
             icon="fa-file-medical" 
             label="Training Data" 
             sub="Poison Scanner"
           />
           <SidebarButton 
             active={activeTab === 'model'} 
             onClick={() => setActiveTab('model')} 
             icon="fa-brain" 
             label="Model Hardening" 
             sub="Red Team & Config"
           />
           <SidebarButton 
             active={activeTab === 'output'} 
             onClick={() => setActiveTab('output')} 
             icon="fa-filter" 
             label="Output Guard" 
             sub="Response Filter"
           />
           
           <div className="px-3 pb-2 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance</div>
           <SidebarButton 
             active={activeTab === 'audit'} 
             onClick={() => setActiveTab('audit')} 
             icon="fa-clipboard-list" 
             label="Audit Logs" 
             sub="Provenance Ledger"
           />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-semibold uppercase">System Status</span>
              <div className={`w-2 h-2 rounded-full ${systemActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
           </div>
           
           <button 
             onClick={() => {
                 setSystemActive(!systemActive);
                 addAuditLog({
                     module: 'System',
                     action: systemActive ? 'KILL SWITCH ENGAGED' : 'System Reactivated',
                     status: SafetyStatus.WARNING,
                     details: 'Manual override by admin',
                     hash: 'ROOT_AUTH'
                 })
             }}
             className={`w-full py-2 rounded border text-xs font-bold transition-all ${systemActive ? 'border-rose-500/50 text-rose-500 hover:bg-rose-950/30' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
           >
             {systemActive ? 'KILL SWITCH' : 'REACTIVATE'}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-900 relative">
        <div className="max-w-6xl mx-auto px-8 py-10">
            
            <header className="mb-8 flex justify-between items-end">
                <div>
                   <h2 className="text-3xl font-bold text-white mb-2">{headerInfo.title}</h2>
                   <p className="text-slate-400">{headerInfo.subtitle}</p>
                </div>
                {activeTab === 'audit' && (
                    <button onClick={generateReport} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-900/20 transition-all">
                        <i className="fas fa-file-pdf mr-2"></i> Incident Report
                    </button>
                )}
            </header>

            {!systemActive && activeTab !== 'audit' && (
                <div className="bg-rose-950/50 border border-rose-500 text-rose-200 p-8 rounded-xl text-center mb-8 animate-pulse">
                    <i className="fas fa-ban text-4xl mb-4"></i>
                    <h3 className="text-xl font-bold">SYSTEM LOCKDOWN</h3>
                    <p>Security Kill-Switch is active. All processing halted.</p>
                </div>
            )}

            {(systemActive || activeTab === 'audit') && (
                <>
                {activeTab === 'system' && <SystemMonitor />}
                {activeTab === 'input' && <PromptFirewall addAuditLog={addAuditLog} />}
                {activeTab === 'output' && <OutputGuard addAuditLog={addAuditLog} />}
                {activeTab === 'audit' && <AuditLog logs={auditLogs} />}
                {activeTab === 'model' && <ModelHardening addAuditLog={addAuditLog} />}

                {activeTab === 'files' && (
                    <div className="space-y-8 animate-fade-in">
                        <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center p-10 group
                            ${isDragging 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
                            }
                        `}
                        >
                        <input type="file" multiple className="hidden" ref={fileInputRef} accept={SUPPORTED_EXTENSIONS.join(',')} onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} />
                        <div className="relative z-10">
                            <i className="fas fa-cloud-upload-alt text-4xl text-slate-500 mb-4 group-hover:text-indigo-400 transition-colors"></i>
                            <h3 className="text-lg font-bold text-slate-200">Drop Datasets & Files</h3>
                            <p className="text-slate-500 text-sm mt-1">CSV, JSON, PDF, Code (Max 10MB)</p>
                        </div>
                        </div>

                        {queue.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {queue.map((item) => (
                                    <React.Fragment key={item.id}>
                                        {item.status === 'scanning' && (
                                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4 animate-pulse">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                </div>
                                                <div>
                                                    <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                                                    <div className="h-3 w-20 bg-slate-700/50 rounded"></div>
                                                </div>
                                            </div>
                                        )}
                                        {item.status === 'complete' && item.result && <FileCard result={item.result} />}
                                        {item.status === 'error' && (
                                            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-400">
                                                <i className="fas fa-exclamation-triangle"></i>
                                                <span className="text-sm">{item.errorMsg}</span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </>
            )}
        </div>
      </main>
    </div>
  );
}

const SidebarButton = ({ active, onClick, icon, label, sub }: any) => (
    <button 
      onClick={onClick}
      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
    >
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
            <i className={`fas ${icon} text-sm`}></i>
        </div>
        <div className="text-left">
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-[10px] opacity-60">{sub}</div>
        </div>
    </button>
);

export default App;
