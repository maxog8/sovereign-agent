import axios from 'axios';
import { logger } from '../utils/logger';

export interface FacebookConfig {
  accessToken: string;
  pageId: string;
}

export interface FacebookPostOptions {
  message?: string;
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
  published?: boolean;
  scheduledPublishTime?: number;
}

export class FacebookService {
  private accessToken: string;
  private pageId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookConfig) {
    this.accessToken = config.accessToken;
    this.pageId = config.pageId;
  }

  /**
   * Initialize and verify credentials
   */
  async initialize(): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.pageId}`,
        {
          params: {
            fields: 'name,username',
            access_token: this.accessToken,
          },
        }
      );

      logger.info(`Facebook service initialized for page: ${response.data.name}`);
    } catch (error) {
      logger.error('Failed to initialize Facebook service:', error);
      throw new Error('Facebook authentication failed');
    }
  }

  /**
   * Post text message to Facebook page
   */
  async postMessage(message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.pageId}/feed`,
        null,
        {
          params: {
            message,
            access_token: this.accessToken,
          },
        }
      );

      const postId = response.data.id;
      logger.info(`Facebook message posted: ${postId}`);
      return postId;
    } catch (error) {
      logger.error('Failed to post Facebook message:', error);
      throw error;
    }
  }

  /**
   * Post link to Facebook page
   */
  async postLink(message: string, link: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.pageId}/feed`,
        null,
        {
          params: {
            message,
            link,
            access_token: this.accessToken,
          },
        }
      );

      const postId = response.data.id;
      logger.info(`Facebook link posted: ${postId}`);
      return postId;
    } catch (error) {
      logger.error('Failed to post Facebook link:', error);
      throw error;
    }
  }

  /**
   * Post photo to Facebook page
   */
  async postPhoto(imageUrl: string, caption?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.pageId}/photos`,
        null,
        {
          params: {
            url: imageUrl,
            caption: caption || '',
            access_token: this.accessToken,
          },
        }
      );

      const photoId = response.data.id;
      logger.info(`Facebook photo posted: ${photoId}`);
      return photoId;
    } catch (error) {
      logger.error('Failed to post Facebook photo:', error);
      throw error;
    }
  }

  /**
   * Post video to Facebook page
   */
  async postVideo(videoUrl: string, description?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.pageId}/videos`,
        null,
        {
          params: {
            file_url: videoUrl,
            description: description || '',
            access_token: this.accessToken,
          },
        }
      );

      const videoId = response.data.id;
      logger.info(`Facebook video posted: ${videoId}`);
      return videoId;
    } catch (error) {
      logger.error('Failed to post Facebook video:', error);
      throw error;
    }
  }

  /**
   * Schedule a post
   */
  async schedulePost(options: FacebookPostOptions): Promise<string> {
    if (!options.scheduledPublishTime) {
      throw new Error('Scheduled publish time is required');
    }

    try {
      const params: any = {
        published: false,
        scheduled_publish_time: options.scheduledPublishTime,
        access_token: this.accessToken,
      };

      if (options.message) params.message = options.message;
      if (options.link) params.link = options.link;

      const response = await axios.post(
        `${this.baseUrl}/${this.pageId}/feed`,
        null,
        { params }
      );

      const postId = response.data.id;
      logger.info(`Facebook post scheduled: ${postId}`);
      return postId;
    } catch (error) {
      logger.error('Failed to schedule Facebook post:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${postId}`, {
        params: {
          access_token: this.accessToken,
        },
      });

      logger.info(`Facebook post deleted: ${postId}`);
    } catch (error) {
      logger.error('Failed to delete Facebook post:', error);
      throw error;
    }
  }

  /**
   * Get post insights (analytics)
   */
  async getPostInsights(postId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${postId}/insights`,
        {
          params: {
            metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get post insights:', error);
      throw error;
    }
  }

  /**
   * Get page insights
   */
  async getPageInsights(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.pageId}/insights`,
        {
          params: {
            metric: 'page_impressions,page_engaged_users,page_fans,page_views_total',
            period: 'day',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get page insights:', error);
      throw error;
    }
  }

  /**
   * Get page posts
   */
  async getPagePosts(limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.pageId}/posts`,
        {
          params: {
            fields: 'id,message,created_time,permalink_url',
            limit,
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get page posts:', error);
      throw error;
    }
  }

  /**
   * Comment on a post
   */
  async commentOnPost(postId: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${postId}/comments`,
        null,
        {
          params: {
            message,
            access_token: this.accessToken,
          },
        }
      );

      const commentId = response.data.id;
      logger.info(`Comment posted on Facebook: ${commentId}`);
      return commentId;
    } catch (error) {
      logger.error('Failed to comment on post:', error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/${postId}/likes`,
        null,
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      logger.info(`Post liked: ${postId}`);
    } catch (error) {
      logger.error('Failed to like post:', error);
      throw error;
    }
  }

  /**
   * Get page follower count
   */
  async getFollowerCount(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.pageId}`,
        {
          params: {
            fields: 'followers_count',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.followers_count || 0;
    } catch (error) {
      logger.error('Failed to get follower count:', error);
      throw error;
    }
  }
}
