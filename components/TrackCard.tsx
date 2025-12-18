
import React, { useState } from 'react';
import { TrackState } from '../types';
import SequencerView from './SequencerView';

interface TrackCardProps {
  track: TrackState;
  index: number;
  onUpdateTrack: (id: number, patch: Partial<TrackState>) => void;
  onSliderChange: (label: string, value: string | number, formatter?: (v: any) => string) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index, onUpdateTrack, onSliderChange }) => {
  const [viewMode, setViewMode] = useState<'sequencer' | 'config'>('sequencer');

  const handleUpdateLFO = (patch: Partial<typeof track.lfo>) => {
    onUpdateTrack(track.id, { lfo: { ...track.lfo, ...patch } });
  };

  const handleUpdateEffects = (patch: Partial<typeof track.effects>) => {
    onUpdateTrack(track.id, { effects: { ...track.effects, ...patch } });
  };

  return (
    <div className="flex flex-col gap-1 p-1.5 md:p-2 border border-gray-100 rounded-xl md:rounded-2xl bg-gray-50/30 overflow-hidden relative h-full">
      {/* Track Header: Status and Toggles */}
      <div className="flex items-center justify-between px-0.5 mb-1">
        <div className="flex items-center gap-1">
           <button 
            onClick={() => setViewMode(viewMode === 'sequencer' ? 'config' : 'sequencer')}
            className={`px-2 md:px-3 h-7 md:h-8 rounded-full text-[8px] md:text-[10px] font-bold transition-all border shadow-sm ${viewMode === 'config' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {viewMode === 'sequencer' ? 'CONFIG' : 'STEPS'}
          </button>
        </div>

        <div className="flex gap-1">
          <button 
            onClick={() => {
              const newSolo = !track.soloed;
              onUpdateTrack(track.id, { soloed: newSolo });
              onSliderChange('SOLO', newSolo ? 'ON' : 'OFF');
            }}
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-[8px] md:text-[10px] font-bold transition-colors border shadow-sm ${track.soloed ? 'bg-amber-400 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
          >
            S
          </button>
          <button 
            onClick={() => {
              const newMuted = !track.muted;
              onUpdateTrack(track.id, { muted: newMuted });
              onSliderChange('MUTE', newMuted ? 'ON' : 'OFF');
            }}
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-[8px] md:text-[10px] font-bold transition-colors border shadow-sm ${track.muted ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
          >
            M
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'sequencer' ? (
          <div className="h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
            <SequencerView 
              steps={track.steps} 
              currentStep={track.currentStep} 
              stepLength={track.stepLength}
              color={track.color}
              onToggle={(idx) => {
                const newSteps = [...track.steps];
                newSteps[idx] = !newSteps[idx];
                onUpdateTrack(track.id, { steps: newSteps });
              }}
            />
            <div className="mt-2 md:mt-4 px-0.5 space-y-2">
                <input 
                  type="range" min="2" max="16" step="1"
                  value={track.stepLength}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    onUpdateTrack(track.id, { stepLength: v });
                    onSliderChange('LENGTH', v, (val) => `${val} STEPS`);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onUpdateTrack(track.id, { volume: v });
                    onSliderChange('VOLUME', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col gap-2 md:gap-3 py-1 px-0.5 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex flex-col gap-2 md:gap-4 pb-4">
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.lfo.rate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateLFO({ rate: v });
                    onSliderChange('LFO SPEED', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.lfo.intensity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateLFO({ intensity: v });
                    onSliderChange('LFO DEPTH', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.effects.filter}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateEffects({ filter: v });
                    onSliderChange('FILTER', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.effects.attack}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateEffects({ attack: v });
                    onSliderChange('ATTACK', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.effects.decay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateEffects({ decay: v });
                    onSliderChange('DECAY', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.effects.delay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateEffects({ delay: v });
                    onSliderChange('DELAY', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={track.effects.reverb}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    handleUpdateEffects({ reverb: v });
                    onSliderChange('REVERB', v);
                  }}
                  className={`track-${index + 1}-thumb`}
                />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackCard;
