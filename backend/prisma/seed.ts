import { PrismaClient } from '@prisma/client';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/blog.sqlite3';
process.env.DATABASE_URL = `file:${path.resolve(dbPath)}`;

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Check if we already have posts
    const existingPosts = await prisma.post.count();
    if (existingPosts > 0) {
      console.log('📝 Database already has posts, skipping seed');
      return;
    }
    
    // Sample blog posts
    const samplePosts = [
      {
        title: 'Welcome to Teacher AI Academy',
        slug: 'welcome-to-teacher-ai-academy',
        summary: 'Discover how artificial intelligence can transform your teaching practice and enhance student learning outcomes.',
        contentMarkdown: `# Welcome to Teacher AI Academy

We're excited to help you integrate AI into your teaching practice. This platform provides comprehensive resources, tools, and strategies to enhance your classroom experience.

## What You'll Learn

- AI fundamentals for educators
- Practical implementation strategies
- Assessment and evaluation techniques
- Ethical considerations and best practices

## Getting Started

Begin your AI journey with our comprehensive curriculum designed specifically for teachers.`,
        contentHtml: `<h1>Welcome to Teacher AI Academy</h1>
<p>We're excited to help you integrate AI into your teaching practice. This platform provides comprehensive resources, tools, and strategies to enhance your classroom experience.</p>
<h2>What You'll Learn</h2>
<ul>
<li>AI fundamentals for educators</li>
<li>Practical implementation strategies</li>
<li>Assessment and evaluation techniques</li>
<li>Ethical considerations and best practices</li>
</ul>
<h2>Getting Started</h2>
<p>Begin your AI journey with our comprehensive curriculum designed specifically for teachers.</p>`,
        tags: ['welcome', 'introduction', 'ai-education'],
        author: 'Teacher AI Academy',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(),
      },
      {
        title: 'Getting Started with AI in the Classroom',
        slug: 'getting-started-with-ai-in-the-classroom',
        summary: 'Learn the essential first steps for introducing AI tools and concepts to your students in a safe and effective way.',
        contentMarkdown: `# Getting Started with AI in the Classroom

Introducing AI to your classroom doesn't have to be overwhelming. Here's a step-by-step guide to get you started.

## Step 1: Start Small

Begin with simple AI tools that enhance existing lessons rather than replacing your teaching methods entirely.

## Step 2: Focus on Learning Objectives

Always start with your learning objectives and use AI to help achieve those goals.

## Step 3: Maintain Human Oversight

AI should enhance your teaching, not replace your professional judgment and relationships with students.`,
        contentHtml: `<h1>Getting Started with AI in the Classroom</h1>
<p>Introducing AI to your classroom doesn't have to be overwhelming. Here's a step-by-step guide to get you started.</p>
<h2>Step 1: Start Small</h2>
<p>Begin with simple AI tools that enhance existing lessons rather than replacing your teaching methods entirely.</p>
<h2>Step 2: Focus on Learning Objectives</h2>
<p>Always start with your learning objectives and use AI to help achieve those goals.</p>
<h2>Step 3: Maintain Human Oversight</h2>
<p>AI should enhance your teaching, not replace your professional judgment and relationships with students.</p>`,
        tags: ['getting-started', 'classroom', 'ai-tools'],
        author: 'Teacher AI Academy',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    ];
    
    // Create sample posts
    for (const postData of samplePosts) {
      await prisma.post.create({
        data: {
          ...postData,
          tags: JSON.stringify(postData.tags),
        },
      });
    }
    
    console.log(`✅ Created ${samplePosts.length} sample blog posts`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
