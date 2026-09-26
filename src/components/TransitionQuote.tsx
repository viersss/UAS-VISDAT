interface TransitionQuoteProps {
  quote: string;
}

export default function TransitionQuote({ quote }: TransitionQuoteProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
      <blockquote className="font-serif italic text-xl sm:text-2xl text-accent-deep text-center leading-relaxed max-w-2xl mx-auto border-t border-b border-line py-8">
        {quote}
      </blockquote>
    </div>
  );
}
