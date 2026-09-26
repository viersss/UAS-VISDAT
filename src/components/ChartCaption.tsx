interface ChartCaptionProps {
  children: React.ReactNode;
}

export default function ChartCaption({ children }: ChartCaptionProps) {
  return (
    <p className="mx-auto mt-3 max-w-3xl text-center text-[11px] leading-relaxed text-ink-muted italic">
      {children}
    </p>
  );
}
