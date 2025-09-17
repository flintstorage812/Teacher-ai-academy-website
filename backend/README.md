# Teacher AI Academy Backend

A Node.js + Express + SQLite backend API for the Teacher AI Academy blog with n8n integration support.

## Features

- **Blog Management**: Full CRUD operations for blog posts
- **n8n Integration**: Webhook endpoint for automated post creation from RSS feeds
- **RSS Feed Generation**: Automatic RSS feed generation for your blog
- **Authentication**: Bearer token authentication for admin endpoints
- **Rate Limiting**: Built-in rate limiting for all endpoints
- **TypeScript**: Full TypeScript support with strict type checking
- **SQLite Database**: Lightweight file-based database with Prisma ORM
- **Docker Support**: Ready-to-deploy Docker container

## Quick Start

### 1. Setup Environment

```bash
cd backend
cp env.example .env
```

Edit `.env` file with your configuration:

```env
PORT=8080
SITE_BASE_URL=http://localhost:8080
FE_ORIGIN=http://127.0.0.1:5500
DB_PATH=./data/blog.sqlite3
ADMIN_BEARER_TOKEN=your-secure-token-here
N8N_WEBHOOK_SECRET=your-webhook-secret-here
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npm run migrate
```

### 4. (Optional) Seed Sample Data

```bash
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Test the API

```bash
curl http://localhost:8080/api/health
```

## API Endpoints

### Public Endpoints (No Authentication Required)

- `GET /api/health` - Health check
- `GET /api/posts` - Get published posts with pagination
- `GET /api/posts/:slug` - Get a specific post by slug
- `GET /api/rss` - RSS feed of published posts

### Admin Endpoints (Require Bearer Token)

- `POST /api/admin/posts` - Create a new post
- `PUT /api/admin/posts/:id` - Update a post
- `DELETE /api/admin/posts/:id` - Delete a post
- `GET /api/admin/posts` - Get all posts (including drafts)

### Webhook Endpoints (Require Secret Header)

- `POST /api/webhook/n8n` - n8n webhook for automated post creation

## Usage Examples

### Create a Blog Post

```bash
curl -X POST http://localhost:8080/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "summary": "A brief summary of the post",
    "contentMarkdown": "# My Post\n\nThis is the content...",
    "tags": ["ai", "education"],
    "status": "PUBLISHED"
  }'
```

### Update a Post

```bash
curl -X PUT http://localhost:8080/api/admin/posts/post-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "title": "Updated Title",
    "summary": "Updated summary"
  }'
```

### Get Published Posts

```bash
curl "http://localhost:8080/api/posts?page=1&limit=10"
```

### n8n Webhook Example

```bash
curl -X POST http://localhost:8080/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -H "x-n8n-secret: your-webhook-secret" \
  -d '{
    "title": "AI-Powered Lesson Planning",
    "summary": "Learn how AI can revolutionize your lesson planning process",
    "contentHtml": "<h1>AI-Powered Lesson Planning</h1><p>Content here...</p>",
    "tags": ["ai", "lesson-planning"],
    "sourceUrl": "https://example.com/original-post"
  }'
```

## Frontend Integration

### Fetch Posts in JavaScript

```javascript
// Fetch published posts
async function fetchPosts(page = 1, limit = 10) {
  try {
    const response = await fetch(`http://localhost:8080/api/posts?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

// Fetch a specific post
async function fetchPost(slug) {
  try {
    const response = await fetch(`http://localhost:8080/api/posts/${slug}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

// Usage
fetchPosts().then(posts => {
  console.log('Posts:', posts.items);
});
```

### Update Your Blog Page

Add this to your `blog.html` to fetch posts dynamically:

```html
<script>
async function loadPosts() {
  try {
    const response = await fetch('http://localhost:8080/api/posts');
    const data = await response.json();
    
    if (data.success) {
      const postsContainer = document.querySelector('.blog-posts');
      postsContainer.innerHTML = '';
      
      data.data.items.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
          <div class="post-meta">
            <div class="post-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              ${new Date(post.publishedAt).toLocaleDateString()}
            </div>
            <div class="post-category">${post.tags[0] || 'General'}</div>
          </div>
          <h2 class="post-title">
            <a href="blog-posts/${post.slug}.html">${post.title}</a>
          </h2>
          <p class="post-excerpt">${post.summary || 'Read more...'}</p>
          <a href="blog-posts/${post.slug}.html" class="read-more">
            Read More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </a>
        `;
        postsContainer.appendChild(postElement);
      });
    }
  } catch (error) {
    console.error('Error loading posts:', error);
  }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadPosts);
</script>
```

## Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t tia-backend .

# Run the container
docker run -d \
  --name tia-backend \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  tia-backend
```

### For Unraid Users

```bash
# Build the image
docker build -t tia-backend .

# Run with Unraid-friendly command
docker run -d \
  --name tia-backend \
  -p 8080:8080 \
  -v /path/to/your/data:/app/data \
  --env-file .env \
  tia-backend
```

## n8n Integration

### Webhook Configuration

1. In n8n, create a new webhook node
2. Set the webhook URL to: `http://your-server:8080/api/webhook/n8n`
3. Add header: `x-n8n-secret` with your webhook secret
4. Configure the payload to match the expected format

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "RSS Feed",
      "type": "n8n-nodes-base.rssFeedRead",
      "parameters": {
        "url": "https://example.com/feed.xml"
      }
    },
    {
      "name": "AI Rewrite",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_OPENAI_API_KEY"
        },
        "body": {
          "model": "gpt-4",
          "messages": [
            {
              "role": "system",
              "content": "Rewrite this RSS article for teachers about AI in education"
            },
            {
              "role": "user",
              "content": "{{$json.content}}"
            }
          ]
        }
      }
    },
    {
      "name": "Send to Blog",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://your-server:8080/api/webhook/n8n",
        "method": "POST",
        "headers": {
          "x-n8n-secret": "your-webhook-secret"
        },
        "body": {
          "title": "{{$json.title}}",
          "summary": "{{$json.summary}}",
          "contentHtml": "{{$json.content}}",
          "tags": ["ai", "education"],
          "sourceUrl": "{{$json.link}}"
        }
      }
    }
  ]
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
backend/
├── src/
│   ├── server.ts          # Main server file
│   ├── db.ts              # Database connection
│   ├── posts.ts           # Posts service and types
│   ├── routes/
│   │   ├── posts.ts       # Admin CRUD routes
│   │   ├── public.ts      # Public read-only routes
│   │   ├── webhook-n8n.ts # n8n webhook endpoint
│   │   └── rss.ts         # RSS feed generation
│   └── middleware/
│       ├── auth.ts        # Authentication middleware
│       └── rateLimit.ts   # Rate limiting middleware
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrate.ts         # Migration script
│   └── seed.ts            # Database seeding
├── data/                  # SQLite database files
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Zod schema validation for all inputs
- **Authentication**: Bearer token authentication for admin endpoints
- **Webhook Security**: Secret-based authentication for n8n webhooks

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `SITE_BASE_URL` | Base URL for your site | `http://localhost:8080` |
| `FE_ORIGIN` | Frontend origin for CORS | `http://127.0.0.1:5500` |
| `DB_PATH` | SQLite database file path | `./data/blog.sqlite3` |
| `ADMIN_BEARER_TOKEN` | Admin authentication token | Required |
| `N8N_WEBHOOK_SECRET` | n8n webhook secret | Required |
| `NODE_ENV` | Environment mode | `development` |

## Troubleshooting

### Common Issues

1. **Database connection failed**: Ensure the data directory exists and is writable
2. **CORS errors**: Check your `FE_ORIGIN` environment variable
3. **Authentication failed**: Verify your `ADMIN_BEARER_TOKEN` is set correctly
4. **Webhook not working**: Check the `x-n8n-secret` header matches your `N8N_WEBHOOK_SECRET`

### Logs

The server logs all requests and errors to the console. In production, consider using a proper logging solution.

### Health Check

The `/api/health` endpoint returns server status and can be used for monitoring.

## License

MIT License - see LICENSE file for details.
