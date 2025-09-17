import { Router, Request, Response } from 'express';
import { PostsService } from '../posts';
import { publicRateLimit } from '../middleware/rateLimit';

const router = Router();

// Apply rate limiting to all public routes
router.use(publicRateLimit);

// Get published posts with pagination
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const orderBy = req.query.orderBy as 'publishedAt' | 'updatedAt' | 'title' || 'publishedAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    
    const postsService = new PostsService(req.app.locals.prisma);
    const result = await postsService.getPosts({
      status: 'PUBLISHED',
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

// Get a specific post by slug
router.get('/posts/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const postsService = new PostsService(req.app.locals.prisma);
    const post = await postsService.getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }
    
    // Only return published posts to public
    if (post.status !== 'PUBLISHED') {
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

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
