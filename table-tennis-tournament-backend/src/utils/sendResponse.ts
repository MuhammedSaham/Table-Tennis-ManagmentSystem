import { Response } from 'express';

interface ApiResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
    errors?: any[];
}

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    message?: string,
    data?: T,
    errors?: any[]
) => {
    const response: ApiResponse<T> = {
        status: statusCode < 400 ? 'success' : 'error',
        message,
        data,
        errors,
    };

    res.status(statusCode).json(response);
};