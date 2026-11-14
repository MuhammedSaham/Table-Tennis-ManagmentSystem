import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../utils/AppError';

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

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  title: "About Sam's College",
  subtitle: "Where education meets opportunity • Established in Northern Sri Lanka",
  badge1: "Northern Sri Lanka",
  badge2: "4 Academy Hubs",
  heroImage: null,
  heroTagline: "Empowering Youth Through Sport",
  heroBadge: "Official Academy",
  introP1: "Sam's College (Pvt) Ltd is a leading table tennis development institution dedicated to empowering individuals and communities through sport. Founded by Mr. Samuel Shanmugam, the College was established to address the need for accessible, professional-standard coaching and structured player development in Northern Sri Lanka.",
  introP2: "Through its programmes, Sam's College provides students with the training, guidance and opportunities they need to develop their skills, build confidence and pursue their sporting ambitions.",
  founderQuote: "Our mission is not just creating champions on the table, but building character, resilience, and discipline that will empower our students throughout their lives.",
  founderName: "Mr. Samuel Shanmugam",
  founderRole: "Founder & Head Coach",
  moreThanTitle: "More Than a Sports Academy",
  moreThanText: "At Sam's College, we view sport as an important part of a well-rounded education. Table tennis helps students develop physical fitness, concentration, confidence, discipline, resilience, teamwork and respect—qualities that contribute to success both on and off the table.",
  storyP1: "What began as a vision to create meaningful opportunities for aspiring table tennis players has grown into a trusted institution serving students of all ages and abilities. Established in Jaffna, Sam's College has expanded its presence to Jaffna Town, Chavakachcheri and Kokuvil.",
  storyP2: "In 2026, the College extended its services to Kilinochchi through a partnership with the Don Bosco School of Excellence. This collaboration established Sam's College's fourth training centre and made structured table tennis development accessible to an even wider community.",
  storyP3: "Our continued growth reflects the trust and support of students, parents, schools and community partners. It also demonstrates our commitment to creating sustainable opportunities for young people through sport and education.",
  programmes: [
    "Professional coaching for beginners, intermediate players and advanced athletes",
    "Structured development in technique, tactics and match strategy",
    "Talent identification and pathways for competitive progression",
    "School partnerships, coaching clinics and community-based programmes",
    "Opportunities to participate in tournaments and development events",
    "A safe, inclusive and supportive environment for every student",
  ],
  activityBook: "As part of our broader educational contribution, Sam's College has also developed a pioneering table tennis activity book. This resource encourages students to learn about the sport, reinforce their understanding and remain engaged beyond regular training sessions.",
  teamP1: "Sam's College is supported by a dedicated team of qualified coaches and administrative professionals. Our team works collaboratively to uphold professional standards, support student wellbeing and provide each player with the individual guidance required to progress.",
  teamP2: "Through their expertise, commitment and encouragement, our staff help students develop not only as athletes but also as confident and responsible individuals.",
  visionP1: "Our vision is to become a leading centre for table tennis education and development, providing a clear and sustainable pathway for talented players from Northern Sri Lanka to progress to regional, national and international levels.",
  visionP2: "At Sam's College, we do more than teach a sport. We nurture confidence, create opportunities and help build the champions of tomorrow—both on and off the table.",
  trainingCentres: [
    { name: "Jaffna Town", address: "Little Chuttys Montessori\nNo. 23/2, Brodie Front Lane, Kandy Road, Jaffna", tag: "Main Academy Hub" },
    { name: "Chavakachcheri", address: "No. 107, Kachchai Road, Chavakachcheri", tag: "Training Hub" },
    { name: "Kokuvil", address: "Kokuvil Community Center\nNo. 58, Pirampady Road, Kokuvil, Jaffna", tag: "Community Centre" },
    { name: "Kilinochchi", address: "Don Bosco School of Excellence\nSt. Theresa College Lane, Karadippokku, Kilinochchi", tag: "New 2026 Campus" },
  ],
};

const dataDir = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'about-content.json');

const getStoredAboutData = (): AboutContent => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(DEFAULT_ABOUT_CONTENT, null, 2), 'utf-8');
      return DEFAULT_ABOUT_CONTENT;
    }
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ABOUT_CONTENT, ...parsed };
  } catch (error) {
    console.error('Error reading about-content.json:', error);
    return DEFAULT_ABOUT_CONTENT;
  }
};

const saveStoredAboutData = (data: AboutContent): void => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

/**
 * Public: Get current About page content
 */
export const getAboutContent = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = getStoredAboutData();
    sendResponse(res, 200, 'About page content fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update About page content
 */
export const updateAboutContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentData = getStoredAboutData();
    const updatePayload = req.body;

    const mergedData: AboutContent = {
      ...currentData,
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    };

    saveStoredAboutData(mergedData);
    sendResponse(res, 200, 'About page content updated successfully', mergedData);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Upload image (poster or photo)
 */
export const uploadAboutPoster = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('No image file uploaded', 400);
    }

    const fileUrl = `/uploads/about/${req.file.filename}`;
    sendResponse(res, 201, 'Image uploaded successfully', { url: fileUrl });
  } catch (error) {
    next(error);
  }
};

