import type { Request, Response } from 'express';

import { exerciseRepository } from '../repositories/exercise.repository.js';
import type {
  CreateExerciseInput,
  UpdateExerciseInput,
} from '../schemas/exercise.schema.js';

type IdParams = { id: string };

function notFound(): never {
  throw Object.assign(new Error('Exercise not found'), { status: 404 });
}

export async function listExercises(_req: Request, res: Response) {
  const exercises = await exerciseRepository.findAll();
  res.status(200).json({
    status: 'success',
    results: exercises.length,
    data: { exercises },
  });
}

export async function getExercise(req: Request<IdParams>, res: Response) {
  const exercise = await exerciseRepository.findById(req.params.id);
  if (!exercise) notFound();

  res.status(200).json({ status: 'success', data: { exercise } });
}

export async function createExercise(
  req: Request<Record<string, string>, unknown, CreateExerciseInput>,
  res: Response,
) {
  const exercise = await exerciseRepository.create(req.body);
  res.status(201).json({ status: 'success', data: { exercise } });
}

export async function updateExercise(
  req: Request<IdParams, unknown, UpdateExerciseInput>,
  res: Response,
) {
  const exercise = await exerciseRepository.update(req.params.id, req.body);
  if (!exercise) notFound();

  res.status(200).json({ status: 'success', data: { exercise } });
}

export async function deleteExercise(req: Request<IdParams>, res: Response) {
  const deleted = await exerciseRepository.delete(req.params.id);
  if (!deleted) notFound();

  res.sendStatus(204);
}
