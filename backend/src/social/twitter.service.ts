import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../utils/logger';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface TweetOptions {
  text: string;
  mediaIds?: string[];
  replyToId?: string;
}

export class TwitterService {
  private client: TwitterApi;
  private userId: string | null = null;

  constructor(config: TwitterConfig) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessSecret,
    });
  }

  /**
   * Initialize and verify credentials
   */
  async initialize(): Promise<void> {
    try {
      const user = await this.client.v2.me();
      this.userId = user.data.id;
      logger.info(`Twitter service initialized for user: @${user.data.username}`);
    } catch (error) {
      logger.error('Failed to initialize Twitter service:', error);
      throw new Error('Twitter authentication failed');
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(options: TweetOptions): Promise<string> {
    try {
      const tweet = await this.client.v2.tweet(options.text, {
        media: options.mediaIds ? { media_ids: options.mediaIds } : undefined,
        reply: options.replyToId ? { in_reply_to_tweet_id: options.replyToId } : undefined,
      });

      logger.info(`Tweet posted successfully: ${tweet.data.id}`);
      return tweet.data.id;
    } catch (error) {
      logger.error('Failed to post tweet:', error);
      throw error;
    }
  }

  /**
   * Schedule a tweet (stores in database, cron job will post)
   */
  async scheduleTweet(text: string, scheduledFor: Date): Promise<void> {
    // This will be implemented with database integration
    logger.info(`Tweet scheduled for ${scheduledFor.toISOString()}`);
  }

  /**
   * Upload media (image/video)
   */
  async uploadMedia(mediaBuffer: Buffer, mediaType: 'image' | 'video'): Promise<string> {
    try {
      const mediaId = await this.client.v1.uploadMedia(mediaBuffer, {
        mimeType: mediaType === 'image' ? 'image/png' : 'video/mp4',
      });

      logger.info(`Media uploaded successfully: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error('Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * Get user timeline
   */
  async getUserTimeline(maxResults: number = 10): Promise<any[]> {
    if (!this.userId) {
      throw new Error('Twitter service not initialized');
    }

    try {
      const timeline = await this.client.v2.userTimeline(this.userId, {
        max_results: maxResults,
      });

      return timeline.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch timeline:', error);
      throw error;
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<void> {
    try {
      await this.client.v2.deleteTweet(tweetId);
      logger.info(`Tweet deleted: ${tweetId}`);
    } catch (error) {
      logger.error('Failed to delete tweet:', error);
      throw error;
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetMetrics(tweetId: string): Promise<any> {
    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at'],
      });

      return tweet.data.public_metrics;
    } catch (error) {
      logger.error('Failed to fetch tweet metrics:', error);
      throw error;
    }
  }
}
