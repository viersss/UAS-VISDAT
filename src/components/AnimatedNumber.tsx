import { useEffect, useState, useRef } from 'react';

export default function AnimatedNumber({ value }: { value: string | number }) {
  const stringValue = String(value);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  // Matches an optional minus sign, numbers, and an optional suffix
  const match = stringValue.match(/^(-?[\d.]+)(.*)$/);
  const numericPart = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const decimals = match ? (match[1].split('.')[1]?.length || 0) : 0;

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible || numericPart === null) return;
    
    let startTimestamp: number | null = null;
    const duration = 2500; // Updated to 2.5 seconds as requested
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(numericPart * ease);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numericPart);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isVisible, numericPart]);

  if (numericPart === null || isNaN(numericPart)) {
    return <span ref={ref}>{stringValue}</span>;
  }

  // Handle negative zero and format
  const formattedValue = (displayValue === 0 && numericPart < 0 && !isVisible) 
    ? (0).toFixed(decimals) 
    : displayValue.toFixed(decimals);

  return (
    <span ref={ref}>
      {isVisible ? formattedValue : (0).toFixed(decimals)}
      {suffix}
    </span>
  );
}
