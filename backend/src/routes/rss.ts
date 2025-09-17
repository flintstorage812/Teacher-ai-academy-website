import { Router, Request, Response } from 'express';
import RSS from 'rss';
import { PostsService } from '../posts';
import { publicRateLimit } from '../middleware/rateLimit';

const router = Router();

// Apply rate limiting
router.use(publicRateLimit);

// Generate RSS feed
router.get('/', async (req: Request, res: Response) => {
  try {
    const siteBaseUrl = process.env.SITE_BASE_URL || 'http://localhost:8080';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const postsService = new PostsService(req.app.locals.prisma);
    const posts = await postsService.getPublishedPostsForRSS(limit);
    
    // Create RSS feed
    const feed = new RSS({
      title: 'Teacher AI Academy Blog',
      description: 'Insights, tips, and strategies for integrating AI into your teaching practice. Stay updated with the latest trends and practical applications.',
      feed_url: `${siteBaseUrl}/api/rss`,
      site_url: `${siteBaseUrl}/blog`,
      language: 'en',
      managingEditor: 'Teacher AI Academy',
      webMaster: 'Teacher AI Academy',
      copyright: `© ${new Date().getFullYear()} Teacher AI Academy`,
      lastBuildDate: new Date(),
      ttl: 60, // Time to live in minutes
    });
    
    // Add posts to feed
    posts.forEach(post => {
      const postUrl = `${siteBaseUrl}/blog/${post.slug}`;
      
      feed.item({
        title: post.title,
        description: post.summary || post.contentHtml || '',
        url: postUrl,
        guid: post.id,
        date: post.publishedAt,
        author: post.author,
        categories: post.tags,
        custom_elements: [
          {
            'content:encoded': {
              _cdata: post.contentHtml || '',
            },
          },
        ],
      });
    });
    
    // Set content type and send RSS
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml({ indent: true }));
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
