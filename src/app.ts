import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import morgan from 'morgan';

import { exerciseRouter } from './routes/exercise.routes.js';
import { userRouter } from './routes/user.routes.js';

export const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/users', userRouter);

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    status: 'fail',
    data: { message: `Cannot find ${req.method} ${req.originalUrl}` },
  });
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 400 && status < 500) {
    res.status(status).json({
      status: 'fail',
      data: { message: err.message },
    });
    return;
  }

  console.error(err);
  res.status(status).json({
    status: 'error',
    message: 'Something went wrong',
  });
};

app.use(notFound);
app.use(errorHandler);
