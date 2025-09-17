import { PrismaClient, Post, PostStatus } from '@prisma/client';
import { marked } from 'marked';

export interface CreatePostData {
  title: string;
  slug?: string;
  summary?: string;
  contentMarkdown?: string;
  contentHtml?: string;
  imageUrl?: string;
  tags?: string[];
  sourceUrl?: string;
  author?: string;
  publishedAt?: Date;
  status?: PostStatus;
}

export interface UpdatePostData {
  title?: string;
  slug?: string;
  summary?: string;
  contentMarkdown?: string;
  contentHtml?: string;
  imageUrl?: string;
  tags?: string[];
  sourceUrl?: string;
  author?: string;
  publishedAt?: Date;
  status?: PostStatus;
}

export interface PostWithTags extends Omit<Post, 'tags'> {
  tags: string[];
}

export interface PaginatedPosts {
  items: PostWithTags[];
  page: number;
  total: number;
  hasMore: boolean;
}

export class PostsService {
  constructor(private prisma: PrismaClient) {}

  // Helper to convert tags JSON string to array
  private parseTags(tagsJson: string): string[] {
    try {
      return JSON.parse(tagsJson);
    } catch {
      return [];
    }
  }

  // Helper to convert tags array to JSON string
  private stringifyTags(tags: string[]): string {
    return JSON.stringify(tags);
  }

  // Helper to convert Post to PostWithTags
  private toPostWithTags(post: Post): PostWithTags {
    return {
      ...post,
      tags: this.parseTags(post.tags),
    };
  }

  // Generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Convert markdown to HTML if needed
  private processContent(data: CreatePostData | UpdatePostData): { contentMarkdown?: string; contentHtml?: string } {
    const result: { contentMarkdown?: string; contentHtml?: string } = {};

    if (data.contentMarkdown) {
      result.contentMarkdown = data.contentMarkdown;
      if (!data.contentHtml) {
        result.contentHtml = marked(data.contentMarkdown);
      }
    }

    if (data.contentHtml) {
      result.contentHtml = data.contentHtml;
    }

    return result;
  }

  async createPost(data: CreatePostData): Promise<PostWithTags> {
    const slug = data.slug || this.generateSlug(data.title);
    const content = this.processContent(data);

    const post = await this.prisma.post.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        contentMarkdown: content.contentMarkdown || '',
        contentHtml: content.contentHtml,
        imageUrl: data.imageUrl,
        tags: this.stringifyTags(data.tags || []),
        sourceUrl: data.sourceUrl,
        author: data.author || 'Teacher AI Academy',
        publishedAt: data.publishedAt || new Date(),
        status: data.status || PostStatus.PUBLISHED,
      },
    });

    return this.toPostWithTags(post);
  }

  async updatePost(id: string, data: UpdatePostData): Promise<PostWithTags> {
    const content = this.processContent(data);
    
    const updateData: any = {
      ...data,
      ...content,
    };

    if (data.tags) {
      updateData.tags = this.stringifyTags(data.tags);
    }

    if (data.slug) {
      updateData.slug = data.slug;
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: updateData,
    });

    return this.toPostWithTags(post);
  }

  async deletePost(id: string): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
  }

  async getPostById(id: string): Promise<PostWithTags | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    return post ? this.toPostWithTags(post) : null;
  }

  async getPostBySlug(slug: string): Promise<PostWithTags | null> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
    });

    return post ? this.toPostWithTags(post) : null;
  }

  async getPosts(options: {
    status?: PostStatus;
    page?: number;
    limit?: number;
    orderBy?: 'publishedAt' | 'updatedAt' | 'title';
    order?: 'asc' | 'desc';
  } = {}): Promise<PaginatedPosts> {
    const {
      status = PostStatus.PUBLISHED,
      page = 1,
      limit = 10,
      orderBy = 'publishedAt',
      order = 'desc',
    } = options;

    const maxLimit = Math.min(limit, 50);
    const skip = (page - 1) * maxLimit;

    const where = status ? { status } : {};

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: maxLimit,
        orderBy: { [orderBy]: order },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: posts.map(post => this.toPostWithTags(post)),
      page,
      total,
      hasMore: skip + maxLimit < total,
    };
  }

  async getPublishedPostsForRSS(limit: number = 50): Promise<PostWithTags[]> {
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return posts.map(post => this.toPostWithTags(post));
  }

  async upsertPostBySlug(data: CreatePostData): Promise<PostWithTags> {
    const slug = data.slug || this.generateSlug(data.title);
    const content = this.processContent(data);

    const post = await this.prisma.post.upsert({
      where: { slug },
      update: {
        title: data.title,
        summary: data.summary,
        contentMarkdown: content.contentMarkdown || '',
        contentHtml: content.contentHtml,
        imageUrl: data.imageUrl,
        tags: this.stringifyTags(data.tags || []),
        sourceUrl: data.sourceUrl,
        author: data.author || 'Teacher AI Academy',
        publishedAt: data.publishedAt || new Date(),
        status: data.status || PostStatus.PUBLISHED,
      },
      create: {
        title: data.title,
        slug,
        summary: data.summary,
        contentMarkdown: content.contentMarkdown || '',
        contentHtml: content.contentHtml,
        imageUrl: data.imageUrl,
        tags: this.stringifyTags(data.tags || []),
        sourceUrl: data.sourceUrl,
        author: data.author || 'Teacher AI Academy',
        publishedAt: data.publishedAt || new Date(),
        status: data.status || PostStatus.PUBLISHED,
      },
    });

    return this.toPostWithTags(post);
  }
}
