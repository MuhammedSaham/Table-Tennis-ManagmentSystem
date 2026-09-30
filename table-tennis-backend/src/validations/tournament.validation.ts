import { z } from 'zod';

// Create tournament validation schema
export const createTournamentSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, 'Tournament name must be at least 3 characters')
      .max(100, 'Tournament name must not exceed 100 characters'),
    
    description: z.string()
      .max(500, 'Description must not exceed 500 characters')
      .optional(),
    
    venue: z.string()
      .min(3, 'Venue must be at least 3 characters')
      .max(200, 'Venue must not exceed 200 characters'),
    
    startDate: z.string()
      .datetime('Invalid start date format'),
    
    endDate: z.string()
      .datetime('Invalid end date format'),
    
    registrationDeadline: z.string()
      .datetime('Invalid registration deadline format'),
    
    maxPlayers: z.number()
      .int('Max players must be a whole number')
      .positive('Max players must be positive')
      .max(1000, 'Max players cannot exceed 1000')
      .optional(),

      tournamentType: z.enum(['KNOCKOUT', 'GROUP_KNOCKOUT']).default('KNOCKOUT'),
  }).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  }).refine(data => new Date(data.registrationDeadline) < new Date(data.startDate), {
    message: 'Registration deadline must be before tournament start date',
    path: ['registrationDeadline'],
  }).refine(data => {
    // Check if tournament duration is not too long (e.g., max 30 days)
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }, {
    message: 'Tournament duration cannot exceed 30 days',
    path: ['endDate'],
  }),
});

// Update tournament validation schema
export const updateTournamentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid tournament ID format'),
  }),
  body: z.object({
    name: z.string()
      .min(3, 'Tournament name must be at least 3 characters')
      .max(100, 'Tournament name must not exceed 100 characters')
      .optional(),
    
    description: z.string()
      .max(500, 'Description must not exceed 500 characters')
      .optional(),
    
    venue: z.string()
      .min(3, 'Venue must be at least 3 characters')
      .max(200, 'Venue must not exceed 200 characters')
      .optional(),
    
    startDate: z.string()
      .datetime('Invalid start date format')
      .optional(),
    
    endDate: z.string()
      .datetime('Invalid end date format')
      .optional(),
    
    registrationDeadline: z.string()
      .datetime('Invalid registration deadline format')
      .optional(),
    
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
      errorMap: () => ({ message: 'Status must be UPCOMING, ONGOING, COMPLETED, or CANCELLED' }),
    }).optional(),
    
    maxPlayers: z.number()
      .int('Max players must be a whole number')
      .positive('Max players must be positive')
      .max(1000, 'Max players cannot exceed 1000')
      .optional(),
  }).refine(data => {
    // If both startDate and endDate are provided, validate they are in correct order
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }).refine(data => {
    // If registrationDeadline and startDate are provided, validate order
    if (data.registrationDeadline && data.startDate) {
      return new Date(data.registrationDeadline) < new Date(data.startDate);
    }
    return true;
  }, {
    message: 'Registration deadline must be before tournament start date',
    path: ['registrationDeadline'],
  }),
});

// Add category validation schema
export const addCategorySchema = z.object({
  params: z.object({
    tournamentId: z.string().cuid('Invalid tournament ID format'),
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Category name must be at least 2 characters')
      .max(100, 'Category name must not exceed 100 characters'),
    
    type: z.enum(['SINGLES', 'DOUBLES','MIXED_DOUBLES', 'TEAM'], {
      errorMap: () => ({ message: 'Type must be SINGLES, DOUBLES, MIXED_DOUBLES, or TEAM' }),
    }),

    stageFormat: z.enum(['KNOCKOUT', 'GROUP_KNOCKOUT']).default('KNOCKOUT').optional(),
    
    minAge: z.number()
      .int('Minimum age must be a whole number')
      .min(5, 'Minimum age cannot be less than 5')
      .max(100, 'Minimum age cannot exceed 100')
      .optional(),
    
    maxAge: z.number()
      .int('Maximum age must be a whole number')
      .min(5, 'Maximum age cannot be less than 5')
      .max(100, 'Maximum age cannot exceed 100')
      .optional(),
    
    gender: z.enum(['MALE', 'FEMALE', 'MIXED'], {
      errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or MIXED' }),
    }).optional(),
    
    maxParticipants: z.number()
      .int('Max participants must be a whole number')
      .min(2, 'Minimum 2 participants required')
      .max(256, 'Max participants cannot exceed 256'),
  }).refine(data => {
    // Validate age range if both provided
    if (data.minAge !== undefined && data.maxAge !== undefined) {
      return data.minAge <= data.maxAge;
    }
    return true;
  }, {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['minAge'],
  }).refine(data => {
    // Validate age range makes sense
    if (data.minAge !== undefined && data.maxAge !== undefined) {
      return (data.maxAge - data.minAge) <= 50;
    }
    return true;
  }, {
    message: 'Age range cannot exceed 50 years',
    path: ['maxAge'],
  }),
});

// Update category validation schema
export const updateCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().cuid('Invalid category ID format'),
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Category name must be at least 2 characters')
      .max(100, 'Category name must not exceed 100 characters')
      .optional(),
    
    type: z.enum(['SINGLES', 'DOUBLES','MIXED_DOUBLES', 'TEAM'], {
      errorMap: () => ({ message: 'Type must be SINGLES, DOUBLES, MIXED_DOUBLES, or TEAM' }),
    }).optional(),

    stageFormat: z.enum(['KNOCKOUT', 'GROUP_KNOCKOUT']).optional(),
    
    minAge: z.number()
      .int('Minimum age must be a whole number')
      .min(5, 'Minimum age cannot be less than 5')
      .max(100, 'Minimum age cannot exceed 100')
      .optional(),
    
    maxAge: z.number()
      .int('Maximum age must be a whole number')
      .min(5, 'Maximum age cannot be less than 5')
      .max(100, 'Maximum age cannot exceed 100')
      .optional(),
    
    gender: z.enum(['MALE', 'FEMALE', 'MIXED'], {
      errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or MIXED' }),
    }).optional(),
    
    maxParticipants: z.number()
      .int('Max participants must be a whole number')
      .min(2, 'Minimum 2 participants required')
      .max(256, 'Max participants cannot exceed 256')
      .optional(),
  }).refine(data => {
    // Validate age range if both provided
    if (data.minAge !== undefined && data.maxAge !== undefined) {
      return data.minAge <= data.maxAge;
    }
    return true;
  }, {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['minAge'],
  }),
});

// Get tournaments query validation
export const getTournamentsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  }),
});