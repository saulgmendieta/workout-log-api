import { randomUUID } from 'node:crypto';

import type {
  CreateExerciseInput,
  UpdateExerciseInput,
} from '../schemas/exercise.schema.js';

export interface Exercise extends CreateExerciseInput {
  id: string;
}

export interface ExerciseRepository {
  findAll(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  create(input: CreateExerciseInput): Promise<Exercise>;
  update(id: string, input: UpdateExerciseInput): Promise<Exercise | null>;
  delete(id: string): Promise<Exercise | null>;
}

const exercises: Exercise[] = [];

function copy(exercise: Exercise): Exercise {
  return { ...exercise };
}

export function reset(): void {
  exercises.length = 0;
}

export const exerciseRepository: ExerciseRepository = {
  async findAll() {
    return exercises.map(copy);
  },

  async findById(id) {
    const exercise = exercises.find((item) => item.id === id);
    return exercise ? copy(exercise) : null;
  },

  async create(input) {
    const exercise: Exercise = { id: randomUUID(), ...input };
    exercises.push(exercise);
    return copy(exercise);
  },

  async update(id, input) {
    const index = exercises.findIndex((item) => item.id === id);
    const current = exercises[index];
    if (index === -1 || !current) return null;

    const updated: Exercise = { ...current, ...input, id: current.id };
    exercises[index] = updated;
    return copy(updated);
  },

  async delete(id) {
    const index = exercises.findIndex((item) => item.id === id);
    const current = exercises[index];
    if (index === -1 || !current) return null;

    exercises.splice(index, 1);
    return copy(current);
  },
};
