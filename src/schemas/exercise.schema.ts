import { z } from 'zod';

export const muscleGroups = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
] as const;

export const createExerciseSchema = z.object({
  name: z.string().min(2),
  muscleGroup: z.enum(muscleGroups),
  equipment: z.string(),
  difficulty: z.number().int().min(1).max(5),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
