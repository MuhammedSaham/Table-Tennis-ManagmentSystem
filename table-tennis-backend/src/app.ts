import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppError } from './utils/AppError';
import { sendResponse } from './utils/sendResponse';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tournamentRoutes from './routes/tournament.routes';
import registrationRoutes from './routes/registration.routes';
import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import resultsRoutes from './routes/results.routes';
import bracketRoutes from './routes/bracket.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import path from 'path';
import adminRequestRoutes from './routes/adminRequest.routes';
import notificationRoutes from './routes/notification.routes';
import groupRoutes from './routes/group.routes';
import clubMembershipRoutes from './routes/clubMembership.routes';
import paymentProofRoutes from './routes/paymentProof.routes';


const app: Application = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req: Request, res: Response) => {
    sendResponse(res, 200, 'Server is running', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/club-membership', clubMembershipRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/brackets', bracketRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/admin-requests', adminRequestRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use(
  '/api/v1/payment-proofs',
  paymentProofRoutes
);
// 404 handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Something went wrong';

    console.error('Error:', err);

    if (process.env.NODE_ENV === 'development') {
        sendResponse(res, statusCode, message, null, [{ stack: err.stack }]);
    } else {
        sendResponse(res, statusCode, message);
    }
});

export default app;