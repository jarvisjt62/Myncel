'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCAPTCHAProps {
  onVerify: (token: string) => void;
  action?: string;
}

export default function ReCAPTCHA({ onVerify, action = 'submit' }: ReCAPTCHAProps) {
  const [loaded, setLoaded] = useState(false);
  const executedRef = useRef(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    // Check if script already loaded
    if (window.grecaptcha) {
      setLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      const existingScript = document.querySelector(`script[src*="recaptcha"]`);
      if (existingScript) existingScript.remove();
    };
  }, []);

  const executeCaptcha = async () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !loaded || !window.grecaptcha) {
      onVerify(''); // No captcha configured, proceed without
      return;
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      onVerify(token);
      executedRef.current = true;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      onVerify('');
    }
  };

  return { executeCaptcha, loaded };
}

// Hook version for easier use
export function useReCAPTCHA() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    if (window.grecaptcha) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  const executeCaptcha = async (action: string = 'submit'): Promise<string> => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !loaded || !window.grecaptcha) {
      return '';
    }

    try {
      return await window.grecaptcha.execute(siteKey, { action });
    } catch {
      return '';
    }
  };

  return { executeCaptcha, loaded };
}