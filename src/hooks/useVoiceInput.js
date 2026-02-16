/**
 * @fileoverview Voice input hook wrapping the Web Speech API.
 * GOOGLE SERVICES: Uses the browser's webkitSpeechRecognition (Google Web Speech).
 * ACCESSIBILITY: Falls back gracefully when Speech API is unavailable.
 */
import { useCallback, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { sanitizeInput } from '../utils/sanitize';

/**
 * Custom hook for speech recognition.
 * Returns controls for starting/stopping voice input.
 * Automatically sanitizes transcripts before storing in game state.
 */
export function useVoiceInput() {
  const recognitionRef = useRef(null);
  const setVoiceTranscript = useGameStore((s) => s.setVoiceTranscript);
  const setIsListening = useGameStore((s) => s.setIsListening);

  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const raw = event.results[0][0].transcript;
      // SECURITY: Sanitize voice input before storing
      const sanitized = sanitizeInput(raw);
      setVoiceTranscript(sanitized);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [isSupported, setVoiceTranscript, setIsListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  }, [setIsListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
  }, [setIsListening]);

  return { isSupported, startListening, stopListening };
}
