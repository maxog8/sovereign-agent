import { Router } from 'express';
import { TwitterService } from '../social/twitter.service';
import { TelegramService } from '../social/telegram.service';
import { DiscordService } from '../social/discord.service';
import { InstagramService } from '../social/instagram.service';
import { FacebookService } from '../social/facebook.service';
import { ContentGenerationService } from '../ai/content.service';
import { MemoryService } from '../memory/memory.service';
import { BlockchainService } from '../blockchain/service';
import { logger } from '../utils/logger';

const router = Router();

// Service instances (will be initialized with config)
let twitterService: TwitterService;
let telegramService: TelegramService;
let discordService: DiscordService;
let instagramService: InstagramService;
let facebookService: FacebookService;
let contentService: ContentGenerationService;
let memoryService: MemoryService;
let blockchainService: BlockchainService;

/**
 * Initialize services
 */
export function initializeServices(config: any) {
  twitterService = new TwitterService(config.twitter);
  telegramService = new TelegramService(config.telegram);
  discordService = new DiscordService(config.discord);
  instagramService = new InstagramService(config.instagram);
  facebookService = new FacebookService(config.facebook);
  contentService = new ContentGenerationService(config.deepseek, config.llama);
  memoryService = new MemoryService(config.greenfield, config.bucketName, config.vectorDb);
  blockchainService = new BlockchainService(config.blockchain);
}

// ==================== AGENT ROUTES ====================

/**
 * Register new agent
 */
router.post('/agent/register', async (req, res) => {
  try {
    const { walletAddress, greenfieldBucketId } = req.body;

    // Register on blockchain
    const tx = await blockchainService.registerAgent(walletAddress, greenfieldBucketId);

    // Initialize user preferences
    await memoryService.updateUserPreferences({
      userId: walletAddress,
      writingStyle: [],
      postingSchedule: {},
      contentTopics: [],
      avoidTopics: [],
      tonePreference: 'professional',
      hashtagStrategy: 'moderate',
      engagementGoals: {},
    });

    res.json({
      success: true,
      transactionHash: tx,
      message: 'Agent registered successfully',
    });
  } catch (error) {
    logger.error('Failed to register agent:', error);
    res.status(500).json({ success: false, error: 'Failed to register agent' });
  }
});

/**
 * Get agent status
 */
router.get('/agent/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const agentData = await blockchainService.getAgent(walletAddress);
    const preferences = await memoryService.getUserPreferences(walletAddress);
    const learnings = await memoryService.learnFromFeedback(walletAddress);

    res.json({
      success: true,
      agent: agentData,
      preferences,
      learnings,
    });
  } catch (error) {
    logger.error('Failed to get agent:', error);
    res.status(500).json({ success: false, error: 'Failed to get agent' });
  }
});

// ==================== CONTENT GENERATION ROUTES ====================

/**
 * Generate content for social media
 */
router.post('/content/generate', async (req, res) => {
  try {
    const { userId, prompt, platform, tone, maxLength } = req.body;

    const content = await contentService.generateContent({
      prompt,
      platform,
      tone,
      maxLength,
      includeHashtags: true,
      includeEmojis: platform !== 'linkedin',
    });

    // Store in memory
    await memoryService.storeMemory({
      id: `content_${Date.now()}`,
      userId,
      type: 'action',
      content: content.text,
      metadata: { platform, prompt },
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    logger.error('Failed to generate content:', error);
    res.status(500).json({ success: false, error: 'Failed to generate content' });
  }
});

/**
 * Generate content in user's style
 */
router.post('/content/generate-styled', async (req, res) => {
  try {
    const { userId, topic, platform } = req.body;

    const content = await contentService.generateInUserStyle(userId, topic, platform);

    res.json({
      success: true,
      content,
    });
  } catch (error) {
    logger.error('Failed to generate styled content:', error);
    res.status(500).json({ success: false, error: 'Failed to generate styled content' });
  }
});

/**
 * Learn user's writing style
 */
router.post('/content/learn-style', async (req, res) => {
  try {
    const { userId, samples } = req.body;

    await contentService.learnWritingStyle(userId, samples);

    res.json({
      success: true,
      message: 'Writing style learned successfully',
    });
  } catch (error) {
    logger.error('Failed to learn writing style:', error);
    res.status(500).json({ success: false, error: 'Failed to learn writing style' });
  }
});

// ==================== SOCIAL MEDIA POSTING ROUTES ====================

/**
 * Post to Twitter
 */
router.post('/social/twitter/post', async (req, res) => {
  try {
    const { userId, text, mediaIds } = req.body;

    const tweetId = await twitterService.postTweet({ text, mediaIds });

    // Store feedback entry
    await memoryService.storeFeedback({
      actionId: tweetId,
      userId,
      outcome: 'success',
      metrics: {},
      learnings: [],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      tweetId,
    });
  } catch (error) {
    logger.error('Failed to post tweet:', error);
    res.status(500).json({ success: false, error: 'Failed to post tweet' });
  }
});

/**
 * Post to Telegram
 */
router.post('/social/telegram/post', async (req, res) => {
  try {
    const { userId, text, parseMode } = req.body;

    const messageId = await telegramService.sendMessage({ text, parseMode });

    await memoryService.storeFeedback({
      actionId: messageId.toString(),
      userId,
      outcome: 'success',
      metrics: {},
      learnings: [],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      messageId,
    });
  } catch (error) {
    logger.error('Failed to send Telegram message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * Post to Discord
 */
router.post('/social/discord/post', async (req, res) => {
  try {
    const { userId, content, embed } = req.body;

    const messageId = await discordService.sendMessage({ content, embed });

    await memoryService.storeFeedback({
      actionId: messageId,
      userId,
      outcome: 'success',
      metrics: {},
      learnings: [],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      messageId,
    });
  } catch (error) {
    logger.error('Failed to send Discord message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * Post to Instagram
 */
router.post('/social/instagram/post', async (req, res) => {
  try {
    const { userId, imageUrl, caption } = req.body;

    const mediaId = await instagramService.postImage({ imageUrl, caption });

    await memoryService.storeFeedback({
      actionId: mediaId,
      userId,
      outcome: 'success',
      metrics: {},
      learnings: [],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      mediaId,
    });
  } catch (error) {
    logger.error('Failed to post to Instagram:', error);
    res.status(500).json({ success: false, error: 'Failed to post to Instagram' });
  }
});

/**
 * Post to Facebook
 */
router.post('/social/facebook/post', async (req, res) => {
  try {
    const { userId, message, link, imageUrl } = req.body;

    let postId: string;

    if (imageUrl) {
      postId = await facebookService.postPhoto(imageUrl, message);
    } else if (link) {
      postId = await facebookService.postLink(message, link);
    } else {
      postId = await facebookService.postMessage(message);
    }

    await memoryService.storeFeedback({
      actionId: postId,
      userId,
      outcome: 'success',
      metrics: {},
      learnings: [],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      postId,
    });
  } catch (error) {
    logger.error('Failed to post to Facebook:', error);
    res.status(500).json({ success: false, error: 'Failed to post to Facebook' });
  }
});

/**
 * Post to all platforms
 */
router.post('/social/post-all', async (req, res) => {
  try {
    const { userId, content, platforms } = req.body;

    const results: any = {};

    for (const platform of platforms) {
      try {
        switch (platform) {
          case 'twitter':
            results.twitter = await twitterService.postTweet({ text: content });
            break;
          case 'telegram':
            results.telegram = await telegramService.sendMessage({ text: content });
            break;
          case 'discord':
            results.discord = await discordService.sendTextMessage(content);
            break;
          case 'instagram':
            // Instagram requires image URL
            break;
          case 'facebook':
            results.facebook = await facebookService.postMessage(content);
            break;
        }
      } catch (error) {
        logger.error(`Failed to post to ${platform}:`, error);
        results[platform] = { error: 'Failed to post' };
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('Failed to post to all platforms:', error);
    res.status(500).json({ success: false, error: 'Failed to post to all platforms' });
  }
});

// ==================== MEMORY ROUTES ====================

/**
 * Get conversation history
 */
router.get('/memory/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const history = await memoryService.getConversationHistory(
      userId,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error('Failed to get conversation history:', error);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * Get user preferences
 */
router.get('/memory/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = await memoryService.getUserPreferences(userId);

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error('Failed to get preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

/**
 * Update user preferences
 */
router.put('/memory/preferences', async (req, res) => {
  try {
    const preferences = req.body;

    await memoryService.updateUserPreferences(preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

/**
 * Get learnings from feedback
 */
router.get('/memory/learnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const learnings = await memoryService.learnFromFeedback(userId);

    res.json({
      success: true,
      learnings,
    });
  } catch (error) {
    logger.error('Failed to get learnings:', error);
    res.status(500).json({ success: false, error: 'Failed to get learnings' });
  }
});

// ==================== BLOCKCHAIN ROUTES ====================

/**
 * Get portfolio balances
 */
router.get('/blockchain/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const balances = await blockchainService.getPortfolioBalances(address);

    res.json({
      success: true,
      balances,
    });
  } catch (error) {
    logger.error('Failed to get portfolio:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio' });
  }
});

/**
 * Execute swap
 */
router.post('/blockchain/swap', async (req, res) => {
  try {
    const { fromToken, toToken, amount, chain } = req.body;

    const tx = await blockchainService.executeSwap(fromToken, toToken, amount, chain);

    res.json({
      success: true,
      transactionHash: tx,
    });
  } catch (error) {
    logger.error('Failed to execute swap:', error);
    res.status(500).json({ success: false, error: 'Failed to execute swap' });
  }
});

// ==================== HEALTH CHECK ====================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now(),
  });
});

export default router;
