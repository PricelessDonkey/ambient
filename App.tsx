
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { TrackState, GlobalState, FeedbackMessage, TrackType } from './types';
import TrackCard from './components/TrackCard';

const TRACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const INITIAL_BPM = 75; // Lowered from 90 for a more relaxed ambient feel

const App: React.FC = () => {
  const [global, setGlobal] = useState<GlobalState>({
    bpm: INITIAL_BPM,
    swing: 0.2,
    isPlaying: false
  });

  const [tracks, setTracks] = useState<TrackState[]>([
    {
      id: 0,
      type: 'chords',
      active: true,
      muted: false,
      soloed: false,
      volume: 0.6,
      steps: Array(16).fill(false).map((_, i) => i === 0), // Only 1 step active
      stepLength: 16,
      currentStep: 0,
      color: TRACK_COLORS[0],
      lfo: { rate: 0.1, intensity: 0.5 },
      effects: { delay: 0.5, reverb: 0.7, filter: 0.25, decay: 0.85, attack: 0.5 }
    },
    {
      id: 1,
      type: 'percussion',
      active: true,
      muted: false,
      soloed: false,
      volume: 0.5,
      steps: Array(16).fill(false).map((_, i) => i === 4 || i === 12),
      stepLength: 16,
      currentStep: 0,
      color: TRACK_COLORS[1],
      lfo: { rate: 0.3, intensity: 0.4 },
      effects: { delay: 0.4, reverb: 0.6, filter: 0.3, decay: 0.5, attack: 0.01 }
    },
    {
      id: 2,
      type: 'crackles',
      active: true,
      muted: false,
      soloed: false,
      volume: 0.3,
      steps: Array(16).fill(false).map((_, i) => i % 7 === 0),
      stepLength: 16,
      currentStep: 0,
      color: TRACK_COLORS[2],
      lfo: { rate: 0.5, intensity: 0.4 },
      effects: { delay: 0.2, reverb: 0.5, filter: 0.2, decay: 0.15, attack: 0.01 }
    },
    {
      id: 3,
      type: 'wash',
      active: true,
      muted: false,
      soloed: false,
      volume: 0.25,
      steps: Array(16).fill(true),
      stepLength: 16,
      currentStep: 0,
      color: TRACK_COLORS[3],
      lfo: { rate: 0.05, intensity: 0.8 },
      effects: { delay: 0.6, reverb: 0.9, filter: 0.15, decay: 0.95, attack: 0.6 }
    }
  ]);

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const synthsRef = useRef<any[]>([]);
  const trackNodesRef = useRef<any[]>([]);
  const tracksRef = useRef<TrackState[]>(tracks);

  // Keep tracksRef in sync with tracks state
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const showFeedback = useCallback((label: string, value: string | number) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ label, value, id: Date.now() });
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 2000);
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
      await Tone.start();
      
      const newSynths: any[] = [];
      const newNodes: any[] = [];

      for (let i = 0; i < 4; i++) {
        const track = tracks[i];
        const reverb = new Tone.Reverb(5).toDestination();
        const delay = new Tone.FeedbackDelay("8n.", 0.5).connect(reverb);
        const filter = new Tone.Filter(2000, i === 2 ? "highpass" : "lowpass").connect(delay);
        const volume = new Tone.Gain(track.volume).connect(filter);
        
        // Add LFO - for crackles track (i === 2), modulate delay wet instead of filter
        const lfo = new Tone.LFO(track.lfo.rate, 0, i === 2 ? 1 : 4000).start();
        if (i === 2) {
          lfo.connect(delay.wet);
        } else {
          lfo.connect(filter.frequency);
        }

        let synth: any;
        if (i === 0) {
          synth = new Tone.PolySynth(Tone.Synth).connect(volume);
          synth.set({ 
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, 
            envelope: { attack: 2, release: 10, sustain: 0.5 } 
          });
        } else if (i === 1) {
          synth = new Tone.Synth().connect(volume);
          synth.set({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } });
        } else if (i === 2) {
          synth = new Tone.NoiseSynth().connect(volume);
          synth.set({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } });
        } else {
          const noise = new Tone.Noise("white").start();
          const ampEnv = new Tone.AmplitudeEnvelope({
            attack: 4,
            decay: 2,
            sustain: 1,
            release: 5
          }).connect(volume);
          noise.connect(ampEnv);
          synth = { type: 'wash', noise, ampEnv };
        }

        newSynths.push(synth);
        newNodes.push({ volume, filter, delay, reverb, lfo });
      }

      synthsRef.current = newSynths;
      trackNodesRef.current = newNodes;
      Tone.Transport.bpm.value = global.bpm;
    };

    setupAudio();

    return () => {
      Tone.Transport.stop();
      synthsRef.current.forEach(s => {
        if (s?.type === 'wash') {
          s.noise?.dispose();
          s.ampEnv?.dispose();
        } else {
          s?.dispose();
        }
      });
      trackNodesRef.current.forEach(n => {
        n.volume?.dispose();
        n.filter?.dispose();
        n.delay?.dispose();
        n.reverb?.dispose();
        n.lfo?.dispose();
      });
    };
  }, []);

  useEffect(() => {
    tracks.forEach((track, i) => {
      const nodes = trackNodesRef.current[i];
      const synth = synthsRef.current[i];
      if (!nodes || !synth) return;

      // Base Cutoff
      const baseCutoff = i === 2 
        ? Math.pow(track.effects.filter, 2) * 5000 + 1000 
        : Math.pow(track.effects.filter, 2) * 8000 + 200; 

      nodes.filter.frequency.value = baseCutoff;

      // Update LFO
      // Map rate from 0-1 to 0.01-5Hz for ambient modulation
      const lfoRate = Math.pow(track.lfo.rate, 2) * 5 + 0.01;
      const lfoAmplitude = track.lfo.intensity;

      nodes.lfo.frequency.rampTo(lfoRate, 0.1);
      nodes.lfo.amplitude.rampTo(lfoAmplitude, 0.1);

      nodes.volume.gain.rampTo(track.volume, 0.1);
      nodes.delay.wet.rampTo(track.effects.delay, 0.1);
      nodes.reverb.wet.rampTo(track.effects.reverb, 0.1);

      const decayVal = track.effects.decay;
      const attackVal = track.effects.attack;
      
      if (i === 0) {
        synth.set({ 
          envelope: { 
            attack: attackVal * 5 + 0.1,
            release: decayVal * 12 + 0.5,
            sustain: 0.6
          } 
        });
      } else if (i === 3) {
        synth.ampEnv.set({ 
          attack: attackVal * 8 + 0.1, 
          release: decayVal * 15 + 1 
        });
      } else {
        synth.set({ 
          envelope: { 
            attack: Math.max(0.001, attackVal * 0.5),
            decay: decayVal * 0.5 + 0.01 
          } 
        });
      }
    });
  }, [tracks]);

  useEffect(() => {
    Tone.Transport.swing = global.swing;
    Tone.Transport.bpm.value = global.bpm;

    const loop = new Tone.Sequence((time, step) => {
      const currentTracks = tracksRef.current;
      const isAnySoloed = currentTracks.some(t => t.soloed);

      // Trigger audio outside of state setter using ref
      currentTracks.forEach((track, i) => {
        const localStep = step % track.stepLength;
        const isStepActive = track.steps[localStep];
        const shouldPlay = isAnySoloed ? track.soloed : !track.muted;

        if (isStepActive && track.active && global.isPlaying && shouldPlay) {
          triggerTrack(i, time, track);
        }
      });

      // Update visual state separately
      setTracks(prev => prev.map((track) => ({
        ...track,
        currentStep: step % track.stepLength
      })));
    }, Array.from({length: 48}, (_, i) => i), "16n").start(0);

    return () => {
      loop.dispose();
    };
  }, [global.bpm, global.swing, global.isPlaying]);

  const triggerTrack = (index: number, time: number, track: TrackState) => {
    const synth = synthsRef.current[index];
    if (!synth) return;

    const aMinor = ['A2', 'C3', 'E3', 'G3', 'A3'];
    const aPentatonic = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4'];
    
    const now = Tone.now();
    // Synchronize JS calculation of LFO phase for generative note selection
    const lfoRate = Math.pow(track.lfo.rate, 2) * 5 + 0.01;
    const lfoPhase = (now * lfoRate) % 1;
    const effectiveIntensity = track.lfo.intensity;

    if (index === 0) {
      // Use LFO phase to drift note selection
      const noteIdx = Math.floor(lfoPhase * aMinor.length * effectiveIntensity + Math.random() * 0.5) % aMinor.length;
      synth.triggerAttackRelease([aMinor[noteIdx], aMinor[(noteIdx + 2) % aMinor.length]], "1n", time);
    } else if (index === 1) {
      const noteIdx = Math.floor(lfoPhase * aPentatonic.length * effectiveIntensity + Math.random() * 0.5) % aPentatonic.length;
      synth.triggerAttackRelease(aPentatonic[noteIdx], "32n", time);
    } else if (index === 2) {
      synth.triggerAttackRelease("64n", time);
    } else if (index === 3) {
      if (track.currentStep === 0) {
          synth.ampEnv.triggerAttackRelease("1n", time);
      }
    }
  };

  const togglePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    if (global.isPlaying) {
      Tone.Transport.pause();
      if (synthsRef.current[3]?.ampEnv) {
          synthsRef.current[3].ampEnv.triggerRelease();
      }
    } else {
      Tone.Transport.start();
    }
    setGlobal(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const updateTrack = (id: number, patch: Partial<TrackState>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const handleSliderChange = (label: string, value: string | number, formatter?: (v: any) => string) => {
    let displayValue: string | number;
    if (formatter) {
      displayValue = formatter(value);
    } else if (typeof value === 'number') {
      displayValue = Math.round(value * 100) + '%';
    } else {
      displayValue = value;
    }
    showFeedback(label, displayValue);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-stretch p-2 md:p-4 overflow-hidden select-none touch-none">
      {feedback && (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-gray-900 text-white px-6 py-2 rounded-full shadow-2xl text-lg font-medium flex gap-4 uppercase tracking-widest">
            <span>{feedback.label}</span>
            <span className="text-gray-400">{feedback.value}</span>
          </div>
        </div>
      )}

      <div className="h-16 flex items-center justify-between px-2 md:px-4 border-b border-gray-100 shrink-0">
        <button 
          onClick={togglePlay}
          className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-colors ${global.isPlaying ? 'bg-red-50' : 'bg-gray-50'}`}
        >
          {global.isPlaying ? (
             <svg className="w-5 h-5 md:w-6 md:h-6 text-red-500 fill-current" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
          ) : (
             <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-500 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        
        <div className="flex-1 flex gap-4 md:gap-8 px-4 md:px-8 items-center">
            <div className="flex-1">
                 <input 
                    type="range" 
                    min="40" max="180" step="1"
                    value={global.bpm}
                    onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setGlobal(prev => ({ ...prev, bpm: v }));
                        handleSliderChange('TEMPO', v, (val) => `${val} BPM`);
                    }}
                    className="w-full accent-gray-500"
                />
            </div>
            <div className="flex-1">
                 <input 
                    type="range" 
                    min="0" max="1" step="0.01"
                    value={global.swing}
                    onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setGlobal(prev => ({ ...prev, swing: v }));
                        handleSliderChange('SWING', v);
                    }}
                    className="w-full accent-gray-500"
                />
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mt-2 md:mt-4 overflow-hidden mb-2">
        {tracks.map((track, i) => (
          <TrackCard 
            key={track.id}
            track={track}
            index={i}
            onUpdateTrack={updateTrack}
            onSliderChange={handleSliderChange}
          />
        ))}
      </div>

      <div className="h-6 flex items-center justify-center text-[8px] md:text-[10px] uppercase tracking-widest text-gray-300 pointer-events-none font-bold shrink-0">
        Ambient Dub Looper &middot; A Minor
      </div>
    </div>
  );
};

export default App;
