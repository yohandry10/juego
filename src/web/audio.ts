import { useEffect, useState } from 'react';

type Cue = 'click' | 'turn' | 'vote' | 'election' | 'crisis';
let context: AudioContext | null = null;
let output: GainNode | null = null;
let ambience: AudioBufferSourceNode | null = null;
let allowed = false;
let level = .25;
function originalScore() {
  if (!context || !output) return;
  // Original 24-second restrained chamber score, generated locally and looped.
  const length = context.sampleRate * 24; const music = context.createBuffer(1, length, context.sampleRate); const data = music.getChannelData(0);
  const chords = [[130.81,155.56,196],[116.54,146.83,174.61],[103.83,130.81,155.56],[116.54,146.83,196]];
  for (let i=0;i<length;i++) { const t=i/context.sampleRate; const phrase=Math.floor(t/6); const local=t%6; const envelope=Math.pow(Math.sin(Math.PI*local/6),2); data[i]=chords[phrase]!.reduce((sum,f)=>sum+Math.sin(2*Math.PI*f*t)*.007,0)*envelope; }
  const source=context.createBufferSource();source.buffer=music;source.loop=true;source.connect(output);source.start();
}

function activate() {
  if (!allowed) return;
  context ??= new AudioContext();
  void context.resume();
  if (!output) {
    output = context.createGain(); output.gain.value = level; output.connect(context.destination);
    // Original synthesized rain: no downloaded recording or external license.
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * .045;
    ambience = context.createBufferSource(); ambience.buffer = buffer; ambience.loop = true;
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
    ambience.connect(filter); filter.connect(output); ambience.start();
    originalScore();
  }
}

export function playGameCue(cue: Cue) {
  if (!allowed || !context || !output || context.state !== 'running') return;
  const notes = cue === 'click' ? [420] : cue === 'crisis' ? [146, 155] : cue === 'vote' ? [220, 330, 440] : cue === 'election' ? [220, 277, 330, 440] : [174, 220, 261];
  notes.forEach((frequency, index) => {
    const oscillator = context!.createOscillator(); const gain = context!.createGain();
    const start = context!.currentTime + index * (cue === 'click' ? 0 : .13);
    oscillator.type = cue === 'click' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(cue === 'click' ? .08 : .11, start + .015);
    gain.gain.exponentialRampToValueAtTime(.001, start + (cue === 'click' ? .06 : .55));
    oscillator.connect(gain); gain.connect(output!); oscillator.start(start); oscillator.stop(start + .6);
  });
}

export function useGameAudio() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('mandato.sound.enabled') === 'true');
  const [volume, setVolume] = useState(() => { const saved=Number(localStorage.getItem('mandato.sound.volume') ?? '.25');return Number.isFinite(saved)?Math.max(0,Math.min(1,saved)):.25; });
  useEffect(() => {
    allowed = enabled; level = Math.max(0, Math.min(1, volume));
    localStorage.setItem('mandato.sound.enabled', String(enabled)); localStorage.setItem('mandato.sound.volume', String(level));
    if (output && context) output.gain.setTargetAtTime(enabled ? level : 0, context.currentTime, .05);
  }, [enabled, volume]);
  useEffect(() => {
    const interaction = () => { activate(); playGameCue('click'); };
    const visibility = () => { if (document.hidden) void context?.suspend(); };
    document.addEventListener('pointerdown', interaction); document.addEventListener('keydown', interaction);
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('pointerdown', interaction); document.removeEventListener('keydown', interaction); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return { enabled, volume, setEnabled, setVolume };
}
