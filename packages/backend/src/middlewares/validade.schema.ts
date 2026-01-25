// packages/backend/src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Erro de validação',
                    errors: error.errors.map(e => ({
                        campo: e.path.join('.'),
                        mensagem: e.message
                    }))
                });
            }
            return res.status(500).json({ error: 'Erro interno na validação' });
        }
    };
