import { Router } from 'express';

import {
  createExercise,
  deleteExercise,
  getExercise,
  listExercises,
  updateExercise,
} from '../controllers/exercise.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createExerciseSchema,
  updateExerciseSchema,
} from '../schemas/exercise.schema.js';

export const exerciseRouter = Router();

exerciseRouter
  .route('/')
  .get(listExercises)
  .post(validate(createExerciseSchema), createExercise);

exerciseRouter
  .route('/:id')
  .get(getExercise)
  .patch(validate(updateExerciseSchema), updateExercise)
  .delete(deleteExercise);
