interface TransitionQuoteProps {
  quote: string;
}

export default function TransitionQuote({ quote }: TransitionQuoteProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
      <blockquote className="font-serif italic text-xl sm:text-2xl text-accent-deep text-center leading-relaxed max-w-2xl mx-auto border-t border-b border-line py-8">
        {quote}
      </blockquote>
    </div>
  );
}
