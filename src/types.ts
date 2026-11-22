export interface WorkshopSpec {
  madera: string;
  tapizado: string;
  forja: string;
  calibreSugerido: string;
  notasTaller: string;
}

export interface TransformResponse {
  resultDataUrl: string;
  translatedPromptEn: string;
  engineUsed: 'flux-kontext' | 'pollinations';
  engineLabel: string;
  fallbackReason?: string;
  workshopSpec: WorkshopSpec;
  seed: number;
}

export interface HistoryVariation {
  id: string;
  createdAt: string;
  originalDataUrl: string;
  resultDataUrl: string;
  prompt: string;
  woodLabel?: string;
  upholsteryLabel?: string;
  forjaLabel?: string;
  engineUsed: 'flux-kontext' | 'pollinations';
  engineLabel: string;
  workshopSpec: WorkshopSpec;
  seed: number;
}

export interface MaterialPreset {
  id: string;
  name: string;
  category: 'wood' | 'upholstery' | 'forja';
  swatchColor: string;
  swatchSecondary?: string;
  promptPhraseEs: string;
  shortSpec: string;
}

export interface SampleFurniture {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  suggestedPrompt: string;
}
