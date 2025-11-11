import axios from 'axios';
import { logger } from '../utils/logger';

export interface ContentGenerationOptions {
  prompt: string;
  platform: 'twitter' | 'telegram' | 'discord' | 'instagram' | 'facebook';
  tone?: 'professional' | 'casual' | 'friendly' | 'technical';
  maxLength?: number;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface GeneratedContent {
  text: string;
  hashtags?: string[];
  estimatedEngagement?: number;
}

export class ContentGenerationService {
  private deepseekEndpoint: string;
  private llamaEndpoint: string;
  private userWritingStyle: Map<string, string[]> = new Map();

  constructor(deepseekEndpoint: string, llamaEndpoint: string) {
    this.deepseekEndpoint = deepseekEndpoint;
    this.llamaEndpoint = llamaEndpoint;
  }

  /**
   * Generate content for social media
   */
  async generateContent(options: ContentGenerationOptions): Promise<GeneratedContent> {
    try {
      const systemPrompt = this.buildSystemPrompt(options);
      const userPrompt = this.buildUserPrompt(options);

      // Use Llama 3 for social media content (fast, free, good quality)
      const response = await this.callLlama(systemPrompt, userPrompt);

      const content = this.parseResponse(response, options);

      logger.info(`Content generated for ${options.platform}`);
      return content;
    } catch (error) {
      logger.error('Failed to generate content:', error);
      throw error;
    }
  }

  /**
   * Analyze and learn user's writing style
   */
  async learnWritingStyle(userId: string, samples: string[]): Promise<void> {
    try {
      const styleAnalysis = await this.analyzeWritingStyle(samples);
      this.userWritingStyle.set(userId, styleAnalysis);
      
      logger.info(`Writing style learned for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to learn writing style:', error);
      throw error;
    }
  }

  /**
   * Generate content in user's style
   */
  async generateInUserStyle(
    userId: string,
    topic: string,
    platform: string
  ): Promise<GeneratedContent> {
    const userStyle = this.userWritingStyle.get(userId);
    
    if (!userStyle) {
      throw new Error('User writing style not learned yet');
    }

    const stylePrompt = `
Write about "${topic}" for ${platform} in this style:
${userStyle.join('\n')}

Maintain the same tone, vocabulary, and structure.
    `.trim();

    return this.generateContent({
      prompt: stylePrompt,
      platform: platform as any,
    });
  }

  /**
   * Improve existing content
   */
  async improveContent(
    originalContent: string,
    improvements: string[]
  ): Promise<string> {
    try {
      const prompt = `
Improve this content based on these suggestions:
${improvements.join('\n')}

Original content:
${originalContent}

Improved version:
      `.trim();

      const response = await this.callLlama(
        'You are a content improvement assistant.',
        prompt
      );

      return response.trim();
    } catch (error) {
      logger.error('Failed to improve content:', error);
      throw error;
    }
  }

  /**
   * Generate hashtags for content
   */
  async generateHashtags(content: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `
Generate ${count} relevant hashtags for this content:
${content}

Return only the hashtags, one per line, with # symbol.
      `.trim();

      const response = await this.callLlama(
        'You are a social media hashtag expert.',
        prompt
      );

      const hashtags = response
        .split('\n')
        .filter(line => line.trim().startsWith('#'))
        .slice(0, count);

      return hashtags;
    } catch (error) {
      logger.error('Failed to generate hashtags:', error);
      return [];
    }
  }

  /**
   * Call DeepSeek V3 for complex reasoning
   */
  private async callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.deepseekEndpoint}/v1/chat/completions`, {
        model: 'deepseek-v3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  /**
   * Call Llama 3 for routine content generation
   */
  private async callLlama(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.llamaEndpoint}/v1/chat/completions`, {
        model: 'llama-3-70b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Llama API call failed:', error);
      throw error;
    }
  }

  /**
   * Build system prompt based on platform
   */
  private buildSystemPrompt(options: ContentGenerationOptions): string {
    const platformGuidelines = {
      twitter: 'Keep it under 280 characters. Be concise and engaging. Use line breaks for readability.',
      telegram: 'Be informative and detailed. Use formatting (bold, italic) when appropriate.',
      discord: 'Be conversational and community-focused. Use emojis moderately.',
      instagram: 'Be visual and inspirational. Focus on storytelling.',
      facebook: 'Be friendly and relatable. Encourage discussion.',
    };

    return `
You are a social media content creator specializing in ${options.platform}.

Platform guidelines: ${platformGuidelines[options.platform]}

Tone: ${options.tone || 'professional'}
${options.includeHashtags ? 'Include relevant hashtags at the end.' : ''}
${options.includeEmojis ? 'Use emojis to enhance engagement.' : ''}

Create authentic, engaging content that resonates with the audience.
    `.trim();
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(options: ContentGenerationOptions): string {
    return `
Create a ${options.platform} post about:
${options.prompt}

${options.maxLength ? `Maximum length: ${options.maxLength} characters` : ''}
    `.trim();
  }

  /**
   * Parse AI response into structured content
   */
  private parseResponse(response: string, options: ContentGenerationOptions): GeneratedContent {
    const lines = response.trim().split('\n');
    const hashtags: string[] = [];
    let text = '';

    for (const line of lines) {
      if (line.trim().startsWith('#')) {
        hashtags.push(line.trim());
      } else if (line.trim()) {
        text += line + '\n';
      }
    }

    return {
      text: text.trim(),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      estimatedEngagement: this.estimateEngagement(text, options.platform),
    };
  }

  /**
   * Analyze writing style from samples
   */
  private async analyzeWritingStyle(samples: string[]): Promise<string[]> {
    const prompt = `
Analyze the writing style from these samples and describe the key characteristics:

${samples.join('\n\n---\n\n')}

Describe:
1. Tone and voice
2. Common phrases or vocabulary
3. Sentence structure
4. Use of emojis/hashtags
5. Overall style
    `.trim();

    const analysis = await this.callDeepSeek(
      'You are a writing style analyst.',
      prompt
    );

    return analysis.split('\n').filter(line => line.trim());
  }

  /**
   * Estimate engagement score
   */
  private estimateEngagement(text: string, platform: string): number {
    let score = 50; // Base score

    // Length optimization
    if (platform === 'twitter' && text.length < 280) score += 10;
    if (platform === 'instagram' && text.length > 100) score += 10;

    // Emoji usage
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    score += Math.min(emojiCount * 5, 15);

    // Question marks (encourage engagement)
    if (text.includes('?')) score += 10;

    // Call to action
    if (text.toLowerCase().includes('comment') || text.toLowerCase().includes('share')) {
      score += 10;
    }

    return Math.min(score, 100);
  }
}
