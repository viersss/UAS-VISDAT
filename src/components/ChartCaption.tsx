interface ChartCaptionProps {
  children: React.ReactNode;
}

export default function ChartCaption({ children }: ChartCaptionProps) {
  return (
    <p className="text-xs text-ink-muted italic text-center mt-3 leading-relaxed">
      {children}
    </p>
  );
}
