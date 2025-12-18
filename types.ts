
export type TrackType = 'chords' | 'percussion' | 'crackles' | 'wash';

export interface LFOConfig {
  rate: number;      // 0-1
  intensity: number; // 0-1
}

export interface TrackState {
  id: number;
  type: TrackType;
  active: boolean;
  muted: boolean;
  soloed: boolean;
  volume: number;
  steps: boolean[];
  stepLength: number;
  currentStep: number;
  color: string;
  lfo: LFOConfig;
  effects: {
    delay: number;
    reverb: number;
    filter: number;
    decay: number;
    attack: number;
  };
}

export interface GlobalState {
  bpm: number;
  swing: number;
  isPlaying: boolean;
}

export interface FeedbackMessage {
  label: string;
  value: string | number;
  id: number;
}
