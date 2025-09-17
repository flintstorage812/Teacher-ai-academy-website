/**
 * Teacher AI Academy Blog API Helper
 * 
 * This file provides JavaScript functions to interact with the backend API
 * and dynamically load blog posts into your HTML pages.
 */

class BlogAPI {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch published blog posts with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Posts per page (default: 10, max: 50)
   * @returns {Promise<Object>} Posts data with pagination info
   */
  async getPosts(page = 1, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/api/posts?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific blog post by slug
   * @param {string} slug - Post slug
   * @returns {Promise<Object>} Post data
   */
  async getPost(slug) {
    try {
      const response = await fetch(`${this.baseUrl}/api/posts/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Get RSS feed URL
   * @returns {string} RSS feed URL
   */
  getRSSUrl() {
    return `${this.baseUrl}/api/rss`;
  }

  /**
   * Check if the API is healthy
   * @returns {Promise<boolean>} API health status
   */
  async isHealthy() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Format date for display
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate HTML for a blog post card
   * @param {Object} post - Post data
   * @returns {string} HTML string
   */
  generatePostCard(post) {
    const date = this.formatDate(post.publishedAt);
    const category = post.tags && post.tags.length > 0 ? post.tags[0] : 'General';
    
    return `
      <article class="blog-post">
        <div class="post-meta">
          <div class="post-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            ${date}
          </div>
          <div class="post-category">${category}</div>
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
      </article>
    `;
  }

  /**
   * Load posts into a container element
   * @param {string} containerSelector - CSS selector for the container
   * @param {number} page - Page number
   * @param {number} limit - Posts per page
   */
  async loadPostsIntoContainer(containerSelector, page = 1, limit = 10) {
    try {
      const container = document.querySelector(containerSelector);
      if (!container) {
        throw new Error(`Container not found: ${containerSelector}`);
      }

      // Show loading state
      container.innerHTML = '<div class="loading">Loading posts...</div>';

      const postsData = await this.getPosts(page, limit);
      
      if (postsData.items.length === 0) {
        container.innerHTML = '<div class="no-posts">No posts found.</div>';
        return;
      }

      // Generate HTML for all posts
      const postsHTML = postsData.items.map(post => this.generatePostCard(post)).join('');
      container.innerHTML = postsHTML;

      // Add pagination if needed
      if (postsData.hasMore) {
        const paginationHTML = this.generatePagination(postsData, page);
        container.insertAdjacentHTML('afterend', paginationHTML);
      }

    } catch (error) {
      console.error('Error loading posts:', error);
      const container = document.querySelector(containerSelector);
      if (container) {
        container.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
      }
    }
  }

  /**
   * Generate pagination HTML
   * @param {Object} postsData - Posts data with pagination info
   * @param {number} currentPage - Current page number
   * @returns {string} Pagination HTML
   */
  generatePagination(postsData, currentPage) {
    const totalPages = Math.ceil(postsData.total / 10); // Assuming 10 posts per page
    
    if (totalPages <= 1) return '';

    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
      paginationHTML += `<a href="#" class="pagination-link" data-page="${currentPage - 1}">← Previous</a>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === currentPage ? 'active' : '';
      paginationHTML += `<a href="#" class="pagination-link ${activeClass}" data-page="${i}">${i}</a>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
      paginationHTML += `<a href="#" class="pagination-link" data-page="${currentPage + 1}">Next →</a>`;
    }
    
    paginationHTML += '</div>';
    
    return paginationHTML;
  }

  /**
   * Initialize pagination event listeners
   * @param {string} containerSelector - Container selector
   */
  initPagination(containerSelector) {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('pagination-link')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (page) {
          await this.loadPostsIntoContainer(containerSelector, page);
          // Scroll to top of container
          const container = document.querySelector(containerSelector);
          if (container) {
            container.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }
}

// Create global instance
window.blogAPI = new BlogAPI();

// Auto-load posts if container exists
document.addEventListener('DOMContentLoaded', async () => {
  const postsContainer = document.querySelector('.blog-posts');
  if (postsContainer && window.blogAPI) {
    // Check if API is healthy first
    const isHealthy = await window.blogAPI.isHealthy();
    if (isHealthy) {
      await window.blogAPI.loadPostsIntoContainer('.blog-posts');
      window.blogAPI.initPagination('.blog-posts');
    } else {
      console.warn('Blog API is not available. Using static content.');
    }
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogAPI;
}
