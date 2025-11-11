import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface InstagramConfig {
  accessToken: string;
  accountId: string;
}

export interface InstagramPostOptions {
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  location?: string;
}

export interface InstagramStoryOptions {
  imageUrl?: string;
  videoUrl?: string;
}

export class InstagramService {
  private accessToken: string;
  private accountId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: InstagramConfig) {
    this.accessToken = config.accessToken;
    this.accountId = config.accountId;
  }

  /**
   * Initialize and verify credentials
   */
  async initialize(): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.accountId}`,
        {
          params: {
            fields: 'username,name',
            access_token: this.accessToken,
          },
        }
      );

      logger.info(`Instagram service initialized for: @${response.data.username}`);
    } catch (error) {
      logger.error('Failed to initialize Instagram service:', error);
      throw new Error('Instagram authentication failed');
    }
  }

  /**
   * Post image to Instagram feed
   */
  async postImage(options: InstagramPostOptions): Promise<string> {
    if (!options.imageUrl) {
      throw new Error('Image URL is required');
    }

    try {
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        null,
        {
          params: {
            image_url: options.imageUrl,
            caption: options.caption || '',
            location_id: options.location,
            access_token: this.accessToken,
          },
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish media container
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: this.accessToken,
          },
        }
      );

      const mediaId = publishResponse.data.id;
      logger.info(`Instagram image posted: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error('Failed to post Instagram image:', error);
      throw error;
    }
  }

  /**
   * Post video to Instagram feed
   */
  async postVideo(options: InstagramPostOptions): Promise<string> {
    if (!options.videoUrl) {
      throw new Error('Video URL is required');
    }

    try {
      // Step 1: Create video container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        null,
        {
          params: {
            media_type: 'VIDEO',
            video_url: options.videoUrl,
            caption: options.caption || '',
            location_id: options.location,
            access_token: this.accessToken,
          },
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Wait for video processing
      await this.waitForVideoProcessing(containerId);

      // Step 3: Publish video
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: this.accessToken,
          },
        }
      );

      const mediaId = publishResponse.data.id;
      logger.info(`Instagram video posted: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error('Failed to post Instagram video:', error);
      throw error;
    }
  }

  /**
   * Post carousel (multiple images)
   */
  async postCarousel(images: string[], caption?: string): Promise<string> {
    try {
      // Step 1: Create containers for each image
      const containerIds: string[] = [];

      for (const imageUrl of images) {
        const response = await axios.post(
          `${this.baseUrl}/${this.accountId}/media`,
          null,
          {
            params: {
              is_carousel_item: true,
              image_url: imageUrl,
              access_token: this.accessToken,
            },
          }
        );

        containerIds.push(response.data.id);
      }

      // Step 2: Create carousel container
      const carouselResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        null,
        {
          params: {
            media_type: 'CAROUSEL',
            children: containerIds.join(','),
            caption: caption || '',
            access_token: this.accessToken,
          },
        }
      );

      const carouselId = carouselResponse.data.id;

      // Step 3: Publish carousel
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: carouselId,
            access_token: this.accessToken,
          },
        }
      );

      const mediaId = publishResponse.data.id;
      logger.info(`Instagram carousel posted: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error('Failed to post Instagram carousel:', error);
      throw error;
    }
  }

  /**
   * Post story
   */
  async postStory(options: InstagramStoryOptions): Promise<string> {
    if (!options.imageUrl && !options.videoUrl) {
      throw new Error('Image or video URL is required for story');
    }

    try {
      const params: any = {
        access_token: this.accessToken,
      };

      if (options.imageUrl) {
        params.image_url = options.imageUrl;
      } else if (options.videoUrl) {
        params.media_type = 'VIDEO';
        params.video_url = options.videoUrl;
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        null,
        { params }
      );

      const containerId = response.data.id;

      // Publish story
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: this.accessToken,
          },
        }
      );

      const mediaId = publishResponse.data.id;
      logger.info(`Instagram story posted: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error('Failed to post Instagram story:', error);
      throw error;
    }
  }

  /**
   * Get media insights (analytics)
   */
  async getMediaInsights(mediaId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${mediaId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get media insights:', error);
      throw error;
    }
  }

  /**
   * Get account insights
   */
  async getAccountInsights(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.accountId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period: 'day',
            access_token: this.accessToken,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get account insights:', error);
      throw error;
    }
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${mediaId}`, {
        params: {
          access_token: this.accessToken,
        },
      });

      logger.info(`Instagram media deleted: ${mediaId}`);
    } catch (error) {
      logger.error('Failed to delete Instagram media:', error);
      throw error;
    }
  }

  /**
   * Wait for video processing to complete
   */
  private async waitForVideoProcessing(containerId: string): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/${containerId}`,
          {
            params: {
              fields: 'status_code',
              access_token: this.accessToken,
            },
          }
        );

        if (response.data.status_code === 'FINISHED') {
          return;
        }

        if (response.data.status_code === 'ERROR') {
          throw new Error('Video processing failed');
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        logger.error('Error checking video status:', error);
        throw error;
      }
    }

    throw new Error('Video processing timeout');
  }
}
