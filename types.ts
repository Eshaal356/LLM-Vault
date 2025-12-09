export type ScanTechnique = 'injection' | 'macro' | 'data_poison' | 'stego' | 'semantic_jailbreak' | 'clean';

export enum SafetyStatus {
  SAFE = 'safe',
  WARNING = 'warning',
  DANGER = 'danger'
}

export interface FileAnalysisResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  hash: string;
  poisoned: boolean;
  confidence: number;
  technique: ScanTechnique;
  reason: string;
  sanitizedSnippet: string;
  timestamp: number;
}

export interface QueuedFile {
  id: string;
  file: File;
  status: 'pending' | 'scanning' | 'complete' | 'error';
  result?: FileAnalysisResult;
  errorMsg?: string;
}

export interface EducationalTip {
  id: number;
  text: string;
}

export interface PromptScanResult {
  safe: boolean;
  flagged_terms: string[];
  injection_detected: boolean;
  semantic_score: number;
  reason: string;
  normalized_text: string;
}

export interface OutputScanResult {
  safe: boolean;
  pii_detected: string[];
  malware_detected: boolean;
  toxicity_score: number;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: 'Input' | 'Output' | 'File' | 'System' | 'Network' | 'Model';
  action: string;
  status: SafetyStatus;
  details: string;
  hash?: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: SafetyStatus;
}
