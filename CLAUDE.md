# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture Overview

This is an **Ambient Dub Looper** - a browser-based step sequencer and synthesizer built with React 19, TypeScript, Vite, and Tone.js for Web Audio.

### Core Structure

- **`App.tsx`** - Main application component containing:
  - Global state (BPM, swing, play/pause)
  - Audio engine setup using Tone.js (synths, effects chains, LFOs)
  - 4 pre-configured tracks with different sound types
  - Transport and sequencer loop logic

- **`types.ts`** - TypeScript interfaces for `TrackState`, `GlobalState`, `LFOConfig`, `FeedbackMessage`

- **`components/`**
  - `TrackCard.tsx` - Individual track UI with sequencer/config view toggle, solo/mute buttons, and parameter sliders
  - `SequencerView.tsx` - 4x4 step grid with variable step length (2-16 steps)
  - `TrackControl.tsx`, `ControlOverlay.tsx` - Placeholder components (currently return null)

### Audio Architecture

Each of the 4 tracks has a distinct sound type:
1. **Chords** (index 0) - PolySynth with fat sawtooth, A minor scale
2. **Percussion** (index 1) - Triangle synth, A pentatonic melody
3. **Crackles** (index 2) - Pink noise synth with highpass filter
4. **Wash** (index 3) - White noise through amplitude envelope

Signal chain per track: `Synth → Gain → Filter → FeedbackDelay → Reverb → Destination`

Each track has an LFO modulating the filter cutoff frequency.

### Styling

Uses Tailwind CSS via CDN. Custom slider styles are defined in `index.html`. Track colors are applied via CSS classes (`.track-1-thumb` through `.track-4-thumb`).

### Path Alias

`@/` maps to the project root directory.
