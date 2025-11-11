import axios from 'axios';
import { logger } from '../utils/logger';

export interface MemoryEntry {
  id: string;
  userId: string;
  type: 'conversation' | 'preference' | 'action' | 'feedback';
  content: string;
  metadata: Record<string, any>;
  timestamp: number;
  embedding?: number[];
}

export interface FeedbackEntry {
  actionId: string;
  userId: string;
  outcome: 'success' | 'failure' | 'partial';
  metrics: {
    engagement?: number;
    clicks?: number;
    impressions?: number;
    sentiment?: number;
  };
  learnings: string[];
  timestamp: number;
}

export interface UserPreferences {
  userId: string;
  writingStyle: string[];
  postingSchedule: {
    twitter?: string[];
    telegram?: string[];
    discord?: string[];
    instagram?: string[];
    facebook?: string[];
  };
  contentTopics: string[];
  avoidTopics: string[];
  tonePreference: string;
  hashtagStrategy: string;
  engagementGoals: Record<string, number>;
}

export class MemoryService {
  private greenfieldEndpoint: string;
  private bucketName: string;
  private vectorDbEndpoint: string;
  private memories: Map<string, MemoryEntry[]> = new Map();
  private feedbackHistory: Map<string, FeedbackEntry[]> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();

  constructor(
    greenfieldEndpoint: string,
    bucketName: string,
    vectorDbEndpoint: string
  ) {
    this.greenfieldEndpoint = greenfieldEndpoint;
    this.bucketName = bucketName;
    this.vectorDbEndpoint = vectorDbEndpoint;
  }

  /**
   * Store memory entry
   */
  async storeMemory(entry: MemoryEntry): Promise<void> {
    try {
      // Generate embedding for semantic search
      if (!entry.embedding) {
        entry.embedding = await this.generateEmbedding(entry.content);
      }

      // Store in local cache
      const userMemories = this.memories.get(entry.userId) || [];
      userMemories.push(entry);
      this.memories.set(entry.userId, userMemories);

      // Store in BNB Greenfield
      await this.saveToGreenfield(entry.userId, 'memories', userMemories);

      // Store embedding in vector database
      await this.storeEmbedding(entry);

      logger.info(`Memory stored for user ${entry.userId}: ${entry.type}`);
    } catch (error) {
      logger.error('Failed to store memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant memories
   */
  async retrieveMemories(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search vector database for similar memories
      const similarMemories = await this.searchSimilarMemories(
        userId,
        queryEmbedding,
        limit
      );

      return similarMemories;
    } catch (error) {
      logger.error('Failed to retrieve memories:', error);
      return [];
    }
  }

  /**
   * Store feedback from action
   */
  async storeFeedback(feedback: FeedbackEntry): Promise<void> {
    try {
      const userFeedback = this.feedbackHistory.get(feedback.userId) || [];
      userFeedback.push(feedback);
      this.feedbackHistory.set(feedback.userId, userFeedback);

      // Save to Greenfield
      await this.saveToGreenfield(feedback.userId, 'feedback', userFeedback);

      // Analyze and update preferences based on feedback
      await this.updatePreferencesFromFeedback(feedback);

      logger.info(`Feedback stored for user ${feedback.userId}: ${feedback.outcome}`);
    } catch (error) {
      logger.error('Failed to store feedback:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Check cache first
      if (this.userPreferences.has(userId)) {
        return this.userPreferences.get(userId)!;
      }

      // Load from Greenfield
      const preferences = await this.loadFromGreenfield(userId, 'preferences');
      
      if (preferences) {
        this.userPreferences.set(userId, preferences);
        return preferences;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      this.userPreferences.set(preferences.userId, preferences);
      await this.saveToGreenfield(preferences.userId, 'preferences', preferences);
      
      logger.info(`Preferences updated for user ${preferences.userId}`);
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Learn from feedback and improve
   */
  async learnFromFeedback(userId: string): Promise<string[]> {
    try {
      const feedback = this.feedbackHistory.get(userId) || [];
      
      if (feedback.length === 0) {
        return [];
      }

      // Analyze patterns
      const patterns = this.analyzeFeedbackPatterns(feedback);

      // Generate learnings
      const learnings: string[] = [];

      // Best performing content types
      const successfulActions = feedback.filter(f => f.outcome === 'success');
      if (successfulActions.length > 0) {
        const avgEngagement = successfulActions.reduce(
          (sum, f) => sum + (f.metrics.engagement || 0),
          0
        ) / successfulActions.length;

        learnings.push(
          `Average engagement on successful posts: ${avgEngagement.toFixed(2)}%`
        );
      }

      // Failed patterns
      const failedActions = feedback.filter(f => f.outcome === 'failure');
      if (failedActions.length > 0) {
        learnings.push(
          `${failedActions.length} actions failed - analyzing common patterns`
        );
      }

      // Time-based patterns
      const timePatterns = this.analyzeTimePatterns(feedback);
      learnings.push(...timePatterns);

      return learnings;
    } catch (error) {
      logger.error('Failed to learn from feedback:', error);
      return [];
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    userId: string,
    limit: number = 50
  ): Promise<MemoryEntry[]> {
    try {
      const memories = this.memories.get(userId) || [];
      return memories
        .filter(m => m.type === 'conversation')
        .slice(-limit);
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Clear user memories (GDPR compliance)
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      this.memories.delete(userId);
      this.feedbackHistory.delete(userId);
      this.userPreferences.delete(userId);

      // Delete from Greenfield
      await this.deleteFromGreenfield(userId);

      logger.info(`All data cleared for user ${userId}`);
    } catch (error) {
      logger.error('Failed to clear user data:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // This would call an embedding model (e.g., sentence-transformers)
      // For now, return a placeholder
      // In production, integrate with a real embedding service
      
      const response = await axios.post(`${this.vectorDbEndpoint}/embed`, {
        text,
      });

      return response.data.embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      // Return zero vector as fallback
      return new Array(768).fill(0);
    }
  }

  /**
   * Store embedding in vector database
   */
  private async storeEmbedding(entry: MemoryEntry): Promise<void> {
    try {
      await axios.post(`${this.vectorDbEndpoint}/store`, {
        id: entry.id,
        userId: entry.userId,
        embedding: entry.embedding,
        metadata: {
          type: entry.type,
          timestamp: entry.timestamp,
        },
      });
    } catch (error) {
      logger.error('Failed to store embedding:', error);
    }
  }

  /**
   * Search for similar memories using vector similarity
   */
  private async searchSimilarMemories(
    userId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<MemoryEntry[]> {
    try {
      const response = await axios.post(`${this.vectorDbEndpoint}/search`, {
        userId,
        embedding: queryEmbedding,
        limit,
      });

      const memoryIds = response.data.results.map((r: any) => r.id);
      
      // Retrieve full memory entries
      const userMemories = this.memories.get(userId) || [];
      return userMemories.filter(m => memoryIds.includes(m.id));
    } catch (error) {
      logger.error('Failed to search similar memories:', error);
      return [];
    }
  }

  /**
   * Save data to BNB Greenfield
   */
  private async saveToGreenfield(
    userId: string,
    dataType: string,
    data: any
  ): Promise<void> {
    try {
      const objectKey = `${userId}/${dataType}.json`;
      
      await axios.put(
        `${this.greenfieldEndpoint}/${this.bucketName}/${objectKey}`,
        JSON.stringify(data),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      logger.error('Failed to save to Greenfield:', error);
    }
  }

  /**
   * Load data from BNB Greenfield
   */
  private async loadFromGreenfield(
    userId: string,
    dataType: string
  ): Promise<any> {
    try {
      const objectKey = `${userId}/${dataType}.json`;
      
      const response = await axios.get(
        `${this.greenfieldEndpoint}/${this.bucketName}/${objectKey}`
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to load from Greenfield:', error);
      return null;
    }
  }

  /**
   * Delete user data from Greenfield
   */
  private async deleteFromGreenfield(userId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.greenfieldEndpoint}/${this.bucketName}/${userId}`
      );
    } catch (error) {
      logger.error('Failed to delete from Greenfield:', error);
    }
  }

  /**
   * Update preferences based on feedback
   */
  private async updatePreferencesFromFeedback(
    feedback: FeedbackEntry
  ): Promise<void> {
    const preferences = await this.getUserPreferences(feedback.userId);
    
    if (!preferences) return;

    // Update engagement goals based on actual performance
    if (feedback.metrics.engagement) {
      const currentGoal = preferences.engagementGoals.overall || 0;
      const newGoal = (currentGoal + feedback.metrics.engagement) / 2;
      preferences.engagementGoals.overall = newGoal;
    }

    // Add learnings to preferences
    if (feedback.learnings.length > 0) {
      // Store learnings as memories
      for (const learning of feedback.learnings) {
        await this.storeMemory({
          id: `learning_${Date.now()}_${Math.random()}`,
          userId: feedback.userId,
          type: 'feedback',
          content: learning,
          metadata: { actionId: feedback.actionId },
          timestamp: Date.now(),
        });
      }
    }

    await this.updateUserPreferences(preferences);
  }

  /**
   * Analyze feedback patterns
   */
  private analyzeFeedbackPatterns(feedback: FeedbackEntry[]): any {
    const patterns = {
      successRate: 0,
      avgEngagement: 0,
      bestTimeToPost: '',
      commonFailures: [],
    };

    const successful = feedback.filter(f => f.outcome === 'success').length;
    patterns.successRate = (successful / feedback.length) * 100;

    const totalEngagement = feedback.reduce(
      (sum, f) => sum + (f.metrics.engagement || 0),
      0
    );
    patterns.avgEngagement = totalEngagement / feedback.length;

    return patterns;
  }

  /**
   * Analyze time-based patterns
   */
  private analyzeTimePatterns(feedback: FeedbackEntry[]): string[] {
    const learnings: string[] = [];

    // Group by hour
    const hourlyPerformance: Record<number, number[]> = {};

    for (const f of feedback) {
      const hour = new Date(f.timestamp).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = [];
      }
      hourlyPerformance[hour].push(f.metrics.engagement || 0);
    }

    // Find best hour
    let bestHour = 0;
    let bestAvg = 0;

    for (const [hour, engagements] of Object.entries(hourlyPerformance)) {
      const avg = engagements.reduce((a, b) => a + b, 0) / engagements.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestHour = parseInt(hour);
      }
    }

    learnings.push(
      `Best posting time: ${bestHour}:00 (avg engagement: ${bestAvg.toFixed(2)}%)`
    );

    return learnings;
  }
}
