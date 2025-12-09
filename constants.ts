import { EducationalTip } from './types';

export const EDUCATIONAL_TIPS: EducationalTip[] = [
  { id: 1, text: "💡 Poisoned datasets can corrupt an LLM's behavior permanently." },
  { id: 2, text: "💡 Prompt injection in documents can manipulate RAG systems." },
  { id: 3, text: "💡 Macros in office files are a classic malware vector." },
  { id: 4, text: "💡 Steganography hides malicious payloads in images or whitespace." },
  { id: 5, text: "💡 Always sanitize third-party data before training." },
  { id: 6, text: "💡 Recursive instructions in PDFs can cause denial of service." },
  { id: 7, text: "💡 Check for 'system:' role hijacking in JSONL files." },
  { id: 8, text: "💡 Never inspect suspicious files outside a sandbox." },
  { id: 9, text: "💡 Validate schemas for all structured data inputs." },
  { id: 10, text: "💡 Semantic jailbreaks use roleplay to bypass safety filters." },
];

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.csv', '.json', 
  '.py', '.ipynb', '.txt', '.md'
];

export const MAILTO_LINK = "mailto:support@llm-vault.com";