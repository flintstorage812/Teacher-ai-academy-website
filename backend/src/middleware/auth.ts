import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = process.env.ADMIN_BEARER_TOKEN;

  if (!token) {
    return res.status(500).json({ 
      error: 'Server configuration error: ADMIN_BEARER_TOKEN not set' 
    });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authorization header required. Format: Bearer <token>' 
    });
  }

  const providedToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (providedToken !== token) {
    return res.status(401).json({ 
      error: 'Invalid authentication token' 
    });
  }

  req.isAuthenticated = true;
  next();
}

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ 
      error: 'Server configuration error: N8N_WEBHOOK_SECRET not set' 
    });
  }

  const providedSecret = req.headers['x-n8n-secret'] as string;

  if (!providedSecret) {
    return res.status(401).json({ 
      error: 'x-n8n-secret header required' 
    });
  }

  if (providedSecret !== secret) {
    return res.status(401).json({ 
      error: 'Invalid webhook secret' 
    });
  }

  next();
}
