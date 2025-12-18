
import React from 'react';

interface SequencerViewProps {
  steps: boolean[];
  currentStep: number;
  stepLength: number;
  color: string;
  onToggle: (index: number) => void;
}

const SequencerView: React.FC<SequencerViewProps> = ({ steps, currentStep, stepLength, color, onToggle }) => {
  return (
    <div className="grid grid-cols-4 gap-[2px] md:gap-1 p-[2px] md:p-1 bg-white rounded-md md:rounded-xl shadow-inner border border-gray-100">
      {Array.from({ length: stepLength }).map((_, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className={`
            aspect-square rounded md:rounded-lg transition-all duration-75
            ${steps[i] ? 'scale-[0.85] md:scale-90 shadow-lg' : 'scale-[0.7] md:scale-75 opacity-10 md:opacity-20'}
            ${currentStep === i ? 'ring-1 md:ring-4 ring-offset-0 md:ring-offset-2 ring-gray-400 ring-opacity-50 z-10' : ''}
          `}
          style={{ 
            backgroundColor: steps[i] ? color : '#e5e7eb',
          }}
        />
      ))}
      {/* Ghost steps for alignment if length < 16 */}
      {Array.from({ length: 16 - stepLength }).map((_, i) => (
        <div key={`ghost-${i}`} className="aspect-square scale-50 opacity-5 bg-gray-200 rounded" />
      ))}
    </div>
  );
};

export default SequencerView;
