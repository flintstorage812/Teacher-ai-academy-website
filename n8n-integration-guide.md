# n8n Integration Guide for Teacher AI Academy Blog

This guide explains how to set up n8n workflows to automatically create and publish blog posts to your Teacher AI Academy website.

## Overview

n8n is a powerful workflow automation tool that can help you:
- Automatically generate blog posts using AI
- Publish posts to your website
- Update RSS feeds
- Manage content scheduling
- Integrate with various AI services

## Prerequisites

- n8n instance (self-hosted or cloud)
- Access to your website's file system or API
- AI service API keys (OpenAI, Claude, etc.)
- Basic understanding of n8n workflows

## Workflow Components

### 1. Content Generation Workflow

This workflow generates blog content using AI services.

#### Nodes Required:
- **Schedule Trigger**: Set up to run daily/weekly
- **HTTP Request**: Call AI API (OpenAI, Claude, etc.)
- **Code Node**: Process and format content
- **File System**: Save generated content

#### Example Workflow:

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "days",
              "daysInterval": 7
            }
          ]
        }
      }
    },
    {
      "name": "Generate Blog Post",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_OPENAI_API_KEY",
          "Content-Type": "application/json"
        },
        "body": {
          "model": "gpt-4",
          "messages": [
            {
              "role": "system",
              "content": "You are an expert education blogger writing for teachers about AI in education. Create engaging, practical content that helps teachers integrate AI into their classrooms."
            },
            {
              "role": "user",
              "content": "Write a blog post about {{$json.topic}} for teachers. Include practical examples, step-by-step instructions, and actionable tips. Format the content in HTML with proper headings, lists, and code blocks where appropriate."
            }
          ],
          "max_tokens": 2000,
          "temperature": 0.7
        }
      }
    }
  ]
}
```

### 2. Content Publishing Workflow

This workflow publishes generated content to your website.

#### Nodes Required:
- **Webhook**: Receive content from generation workflow
- **Code Node**: Format content for HTML template
- **File System**: Create HTML files
- **HTTP Request**: Update RSS feed

#### Example Code Node for HTML Generation:

```javascript
// Process AI-generated content and create HTML file
const content = $input.first().json.choices[0].message.content;
const title = extractTitle(content);
const excerpt = extractExcerpt(content);
const category = determineCategory(content);
const date = new Date().toISOString().split('T')[0];

// Create filename from title
const filename = title.toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s+/g, '-')
  .substring(0, 50);

// Generate HTML content using template
const htmlContent = generateHTMLFromTemplate({
  title,
  excerpt,
  content,
  category,
  date,
  filename
});

return {
  filename: `${filename}.html`,
  content: htmlContent,
  metadata: {
    title,
    excerpt,
    category,
    date
  }
};
```

### 3. RSS Feed Update Workflow

This workflow updates your RSS feed with new posts.

#### Nodes Required:
- **Webhook**: Receive new post data
- **Code Node**: Parse existing RSS and add new item
- **File System**: Update RSS XML file

#### Example RSS Update Code:

```javascript
// Read existing RSS feed
const existingRSS = $input.first().json.existingRSS;
const newPost = $input.first().json.newPost;

// Parse RSS and add new item
const rssItems = parseRSSItems(existingRSS);
const newItem = createRSSItem(newPost);

// Add new item to beginning of list
rssItems.unshift(newItem);

// Limit to 10 most recent posts
const limitedItems = rssItems.slice(0, 10);

// Generate updated RSS
const updatedRSS = generateRSS(limitedItems);

return {
  rssContent: updatedRSS
};
```

## Setup Instructions

### Step 1: Install n8n

```bash
# Using npm
npm install n8n -g

# Using Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### Step 2: Configure AI Service

1. Get API key from your chosen AI service
2. Create credentials in n8n for the AI service
3. Test the connection

### Step 3: Set Up File System Access

1. Configure file system credentials in n8n
2. Set up proper permissions for your website directory
3. Test file creation and updates

### Step 4: Create Workflows

1. Import the provided workflow templates
2. Customize prompts and parameters
3. Test each workflow component
4. Set up error handling and notifications

### Step 5: Schedule and Monitor

1. Set up appropriate schedules for content generation
2. Configure monitoring and alerts
3. Test the complete workflow end-to-end

## Advanced Features

### Content Categorization

Use AI to automatically categorize posts:

```javascript
const categories = [
  'Lesson Planning',
  'Assessment',
  'Classroom Management',
  'Student Engagement',
  'AI Tools',
  'Best Practices'
];

const category = await classifyContent(content, categories);
```

### SEO Optimization

Automatically generate SEO-friendly content:

```javascript
const seoData = {
  title: generateSEOTitle(content),
  description: generateMetaDescription(content),
  keywords: extractKeywords(content),
  tags: generateTags(content)
};
```

### Social Media Integration

Automatically share new posts on social media:

```javascript
// Twitter integration
const tweet = generateTweet(excerpt, url);
await postToTwitter(tweet);

// LinkedIn integration
const linkedinPost = generateLinkedInPost(content, url);
await postToLinkedIn(linkedinPost);
```

## Error Handling

### Common Issues and Solutions

1. **API Rate Limits**: Implement retry logic with exponential backoff
2. **File Permission Errors**: Check file system permissions
3. **Content Quality Issues**: Add content validation steps
4. **RSS Feed Errors**: Validate XML before saving

### Monitoring and Alerts

Set up monitoring for:
- Workflow execution status
- API response times
- Content generation quality
- File system errors

## Security Considerations

1. **API Keys**: Store securely in n8n credentials
2. **File Access**: Use minimal required permissions
3. **Content Validation**: Sanitize AI-generated content
4. **Backup**: Regular backups of generated content

## Troubleshooting

### Debug Workflow Issues

1. Use n8n's execution log to identify failures
2. Test individual nodes in isolation
3. Check API responses and error messages
4. Validate data formats between nodes

### Common Debugging Steps

```javascript
// Add debugging to Code nodes
console.log('Input data:', $input.all());
console.log('Processing step:', stepName);
console.log('Output data:', processedData);
```

## Best Practices

1. **Start Simple**: Begin with basic workflows and add complexity gradually
2. **Test Thoroughly**: Test each component before connecting workflows
3. **Monitor Performance**: Track execution times and resource usage
4. **Backup Content**: Keep backups of all generated content
5. **Review Generated Content**: Always review AI-generated content before publishing

## Example Complete Workflow

Here's a complete example workflow that generates and publishes a blog post:

```json
{
  "name": "AI Blog Post Generator",
  "nodes": [
    {
      "name": "Weekly Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "days",
              "daysInterval": 7
            }
          ]
        }
      }
    },
    {
      "name": "Generate Topic",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return [{ topic: 'AI Tools for Differentiated Instruction' }];"
      }
    },
    {
      "name": "Generate Content",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json"
        },
        "body": {
          "model": "gpt-4",
          "messages": [
            {
              "role": "system",
              "content": "You are an expert education blogger. Write engaging, practical content for teachers about AI in education."
            },
            {
              "role": "user",
              "content": "Write a comprehensive blog post about {{$json.topic}}. Include practical examples, step-by-step instructions, and actionable tips. Format in HTML."
            }
          ]
        }
      }
    },
    {
      "name": "Process Content",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Process and format the generated content\nconst content = $input.first().json.choices[0].message.content;\nconst title = content.match(/<h1[^>]*>(.*?)<\\/h1>/)?.[1] || 'AI in Education';\nconst excerpt = content.match(/<p[^>]*>(.*?)<\\/p>/)?.[1] || 'Learn about AI in education';\n\nreturn [{\n  title,\n  excerpt,\n  content,\n  date: new Date().toISOString().split('T')[0],\n  category: 'AI Tools'\n}];"
      }
    },
    {
      "name": "Create HTML File",
      "type": "n8n-nodes-base.writeFile",
      "parameters": {
        "fileName": "blog-posts/{{$json.title.toLowerCase().replace(/[^a-z0-9\\s]/g, '').replace(/\\s+/g, '-').substring(0, 50)}}.html",
        "data": "{{$json.content}}"
      }
    },
    {
      "name": "Update RSS Feed",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Update RSS feed with new post\n// Implementation depends on your RSS structure\nreturn $input.all();"
      }
    }
  ]
}
```

## Support and Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [AI API Documentation](https://platform.openai.com/docs)
- [RSS 2.0 Specification](https://cyber.harvard.edu/rss/rss.html)

## Conclusion

This integration guide provides a foundation for automating your blog content creation and publishing process. Customize the workflows based on your specific needs and gradually add more sophisticated features as you become comfortable with the system.

Remember to always review AI-generated content before publishing and maintain backups of your content and workflows.
