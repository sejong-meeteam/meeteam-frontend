type CropShape = 'rect' | 'circle';

export interface ImageCropModalProps {
  file: File | null;
  isOpen: boolean;
  title: string;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  cropShape?: CropShape;
  onClose: () => void;
  onConfirm: (file: File) => void;
}
