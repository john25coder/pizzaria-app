import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ✅ Helmet - Headers de segurança HTTP
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ✅ Rate Limiting - Proteção contra brute force
export const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 tentativas por IP
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const limiterRegister = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // Máximo 3 registros por IP
    message: 'Muitos registros. Tente novamente em 1 hora.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const limiterAPI = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // Máximo 100 requisições por minuto
    message: 'Muitas requisições. Tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
