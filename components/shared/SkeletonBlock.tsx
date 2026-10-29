type SkeletonBlockProps = {
  className?: string;
};

export default function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-mt-bg-soft motion-reduce:animate-none ${className}`}
    />
  );
}
