import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PostsService } from '../posts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { adminRateLimit } from '../middleware/rateLimit';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  contentMarkdown: z.string().optional(),
  contentHtml: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  author: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const updatePostSchema = createPostSchema.partial();

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Apply authentication to all admin routes
router.use(requireAuth);

// Create a new post
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createPostSchema.parse(req.body);
    
    const postsService = new PostsService(req.app.locals.prisma);
    
    // Convert publishedAt string to Date if provided
    if (validatedData.publishedAt) {
      validatedData.publishedAt = new Date(validatedData.publishedAt);
    }
    
    const post = await postsService.createPost(validatedData);
    
    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        error: 'A post with this slug already exists',
      });
    }
    
    console.error('Error creating post:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Update a post by ID
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updatePostSchema.parse(req.body);
    
    const postsService = new PostsService(req.app.locals.prisma);
    
    // Convert publishedAt string to Date if provided
    if (validatedData.publishedAt) {
      validatedData.publishedAt = new Date(validatedData.publishedAt);
    }
    
    const post = await postsService.updatePost(id, validatedData);
    
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        error: 'A post with this slug already exists',
      });
    }
    
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Delete a post by ID
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const postsService = new PostsService(req.app.locals.prisma);
    await postsService.deletePost(id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }
    
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get all posts (admin view - includes drafts)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as 'DRAFT' | 'PUBLISHED' | undefined;
    const orderBy = req.query.orderBy as 'publishedAt' | 'updatedAt' | 'title' || 'publishedAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    
    const postsService = new PostsService(req.app.locals.prisma);
    const result = await postsService.getPosts({
      status,
      page,
      limit,
      orderBy,
      order,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get a specific post by ID (admin view)
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const postsService = new PostsService(req.app.locals.prisma);
    const post = await postsService.getPostById(id);
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }
    
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
