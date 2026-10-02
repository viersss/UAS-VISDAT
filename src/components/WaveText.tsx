interface WaveTextProps {
  text?: string;
}

export default function WaveText({ text = 'Ketimpangan Pembangunan Indonesia' }: WaveTextProps) {
  // If the standard hero title is passed, structure it into two distinct lines
  if (text.includes('Ketimpangan Pembangunan') && text.includes('Indonesia')) {
    return (
      <span className="hero-title-group">
        <span className="hero-title-line-1">
          <span className="animate-wave-text" style={{ animationDelay: '0.1s' }}>
            Ketimpangan
          </span>{' '}
          <span className="animate-wave-text" style={{ animationDelay: '0.3s' }}>
            Pembangunan
          </span>
        </span>
        <span className="hero-title-line-2">
          <span
            className="hero-title-highlight animate-wave-text"
            style={{ animationDelay: '0.55s' }}
          >
            Indonesia
          </span>
        </span>
      </span>
    );
  }

  const words = text.split(' ');
  return (
    <span className="inline-flex flex-wrap justify-center gap-x-[0.25em]">
      {words.map((word, i) => (
        <span
          key={i}
          className="animate-wave-text"
          style={{ animationDelay: `${i * 0.25 + 0.1}s` }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
