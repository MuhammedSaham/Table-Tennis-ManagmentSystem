import api, { getProfileImageUrl } from './api';

export interface TrainingCentre {
  name: string;
  address: string;
  tag: string;
}

export interface AboutContent {
  title: string;
  subtitle: string;
  badge1: string;
  badge2: string;
  heroImage: string | null;
  heroTagline: string;
  heroBadge: string;
  introP1: string;
  introP2: string;
  founderQuote: string;
  founderName: string;
  founderRole: string;
  moreThanTitle: string;
  moreThanText: string;
  storyP1: string;
  storyP2: string;
  storyP3: string;
  programmes: string[];
  activityBook: string;
  teamP1: string;
  teamP2: string;
  visionP1: string;
  visionP2: string;
  trainingCentres: TrainingCentre[];
  updatedAt?: string;
}

export const getAboutContent = async (): Promise<AboutContent> => {
  const response = await api.get('/about');
  return response.data.data;
};

export const updateAboutContent = async (
  content: Partial<AboutContent>
): Promise<AboutContent> => {
  const response = await api.put('/about', content);
  return response.data.data;
};

export const uploadAboutImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/about/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export const resolveAboutImageUrl = (path?: string | null): string => {
  if (!path) return '';
  return getProfileImageUrl(path);
};

