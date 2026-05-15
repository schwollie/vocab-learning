"use client";

import { useEffect, useState, useRef } from "react";
import { Volume2 } from "lucide-react";

interface AudioPlayerProps {
  text: string;
  language?: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ text, language = "en-US", autoPlay = false }: AudioPlayerProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if (window.speechSynthesis) {
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
             window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }
  }, []);

  const playAudio = () => {
    if (!window.speechSynthesis) return;

    // Cancel any currently playing speech to prevent queuing overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9; // Slightly slower for language learning

    // Prefer high quality voices if available based on target language
    const preferredVoices = voices.filter(v => v.lang === language || v.lang.startsWith(language.split('-')[0]));
    
    // Look for a Google or enhanced voice first.
    const enhancedVoice = preferredVoices.find(v => v.name.includes("Premium") || v.name.includes("Google") || v.name.includes("Enhanced"));
    if (enhancedVoice) utterance.voice = enhancedVoice;
    else if (preferredVoices.length > 0) utterance.voice = preferredVoices[0];

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (autoPlay && text) {
      // Small timeout fixes autoplay block policy issues on some browsers after interactions
      setTimeout(() => playAudio(), 150);
    }
  }, [text, autoPlay]);

  return (
    <button
      ref={buttonRef}
      onClick={playAudio}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
      aria-label="Play audio"
    >
      <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  );
}