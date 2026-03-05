import { useState, useEffect } from 'react';

export default function TypewriterText({ text }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [index, text]);

  return (
    <span>
      {displayedText}
      {index < text.length && <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse align-middle" />}
    </span>
  );
}
