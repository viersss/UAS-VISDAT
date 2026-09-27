export default function WaveText({ text }: { text: string }) {
  // Split the text into words to animate them sequentially
  const words = text.split(' ');

  return (
    <span className="inline-flex flex-wrap justify-center gap-x-[0.25em]">
      {words.map((word, i) => (
        <span
          key={i}
          className="animate-wave-text"
          style={{ animationDelay: `${i * 0.5 + 0.1}s` }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
