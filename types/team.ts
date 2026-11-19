export type Teammate = {
  id: number;
  name: string;
  department?: string | null;
  role: string;
  experienceCount: number;
  skills: string[];
  imageUrl: string;
};
