import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { reset } from '../src/repositories/exercise.repository.js';

const exercise = {
  name: 'Bench press',
  muscleGroup: 'chest',
  equipment: 'barbell',
  difficulty: 3,
};

const unknownId = '00000000-0000-4000-8000-000000000000';

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function createExercise() {
  const res = await request(app).post('/api/v1/exercises').send(exercise);
  return res.body.data.exercise;
}

describe('exercises', () => {
  beforeEach(() => reset());

  it('lists no exercises, then the one that was created', async () => {
    const empty = await request(app).get('/api/v1/exercises');

    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({
      status: 'success',
      results: 0,
      data: { exercises: [] },
    });

    const created = await createExercise();
    const list = await request(app).get('/api/v1/exercises');

    expect(list.status).toBe(200);
    expect(list.body).toEqual({
      status: 'success',
      results: 1,
      data: { exercises: [created] },
    });
  });

  it('gets an exercise by id', async () => {
    const created = await createExercise();
    const res = await request(app).get(`/api/v1/exercises/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      data: { exercise: created },
    });
  });

  it('creates an exercise', async () => {
    const res = await request(app).post('/api/v1/exercises').send(exercise);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'success',
      data: { exercise },
    });
    expect(res.body.data.exercise.id).toMatch(uuid);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(app).post('/api/v1/exercises').send({ name: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/exercises')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'fail',
      data: { message: expect.any(String) },
    });
  });

  it('returns 404 for an unknown id', async () => {
    const getRes = await request(app).get(`/api/v1/exercises/${unknownId}`);
    const patchRes = await request(app)
      .patch(`/api/v1/exercises/${unknownId}`)
      .send({ difficulty: 1 });
    const deleteRes = await request(app).delete(`/api/v1/exercises/${unknownId}`);

    for (const res of [getRes, patchRes, deleteRes]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 'fail',
        data: { message: 'Exercise not found' },
      });
    }
  });

  it('updates only the given field', async () => {
    const created = await createExercise();
    const res = await request(app)
      .patch(`/api/v1/exercises/${created.id}`)
      .send({ difficulty: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      data: {
        exercise: { ...created, difficulty: 5 },
      },
    });
  });

  it('deletes an exercise', async () => {
    const created = await createExercise();
    const deleted = await request(app).delete(`/api/v1/exercises/${created.id}`);
    const fetched = await request(app).get(`/api/v1/exercises/${created.id}`);

    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    expect(fetched.status).toBe(404);
    expect(fetched.body).toEqual({
      status: 'fail',
      data: { message: 'Exercise not found' },
    });
  });

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/v1/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'fail',
      data: { message: 'Cannot find GET /api/v1/unknown' },
    });
  });
});
