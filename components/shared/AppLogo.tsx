import Image from 'next/image';

type AppLogoProps = {
  className?: string;
  priority?: boolean;
};

export default function AppLogo({ className = 'h-8 w-36', priority = false }: AppLogoProps) {
  return (
    <span className={`relative block shrink-0 ${className}`}>
      <Image
        src="/brand/meeteam_logo_hat_wide.png"
        alt="meeTeam 로고"
        fill
        priority={priority}
        unoptimized
        sizes="(max-width: 768px) 240px, 320px"
        className="object-contain"
      />
    </span>
  );
}
