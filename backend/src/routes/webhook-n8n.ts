import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PostsService } from '../posts';
import { requireWebhookSecret } from '../middleware/auth';
import { webhookRateLimit } from '../middleware/rateLimit';

const router = Router();

// Validation schema for n8n webhook payload
const n8nWebhookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  contentHtml: z.string().optional(),
  contentMarkdown: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional(),
});

// Apply rate limiting and authentication
router.use(webhookRateLimit);
router.use(requireWebhookSecret);

// n8n webhook endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = n8nWebhookSchema.parse(req.body);
    
    const postsService = new PostsService(req.app.locals.prisma);
    
    // Convert publishedAt string to Date if provided
    if (validatedData.publishedAt) {
      validatedData.publishedAt = new Date(validatedData.publishedAt);
    }
    
    // Use upsert to either update existing post or create new one
    const post = await postsService.upsertPostBySlug({
      ...validatedData,
      status: 'PUBLISHED', // n8n posts are always published
    });
    
    res.json({
      ok: true,
      id: post.id,
      slug: post.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Error processing n8n webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
