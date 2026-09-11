import app from './app';
import { config } from './config/env';

const PORT = config.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        console.error('Stop the other process or change the port');
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown (SIGTERM - e.g., Docker, hosting)
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

// Handle Ctrl + C (nodemon / local dev)
process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default server;