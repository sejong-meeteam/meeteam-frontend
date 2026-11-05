import { FolderKanban } from 'lucide-react';

type ProjectThumbnailProps = {
  name: string;
  imageUrl: string | null;
  sizeClassName?: string;
};

export default function ProjectThumbnail({
  name,
  imageUrl,
  sizeClassName = 'h-10 w-14',
}: ProjectThumbnailProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-mt-border bg-mt-badge-bg text-mt-primary ${sizeClassName}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`${name} 커버`} className="h-full w-full object-cover" />
      ) : (
        <FolderKanban className="h-4 w-4" aria-hidden strokeWidth={1.8} />
      )}
    </span>
  );
}
