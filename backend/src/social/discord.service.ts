import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { logger } from '../utils/logger';

export interface DiscordConfig {
  botToken: string;
  channelId?: string;
}

export interface MessageOptions {
  content?: string;
  embed?: {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
    timestamp?: boolean;
  };
  files?: string[];
}

export class DiscordService {
  private client: Client;
  private channelId: string | null = null;
  private isReady: boolean = false;

  constructor(config: DiscordConfig) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.channelId = config.channelId || null;

    this.client.once('ready', () => {
      this.isReady = true;
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.login(config.botToken);
  }

  /**
   * Wait for bot to be ready
   */
  private async waitForReady(): Promise<void> {
    if (this.isReady) return;

    return new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Send message to channel
   */
  async sendMessage(options: MessageOptions, channelId?: string): Promise<string> {
    await this.waitForReady();

    const targetChannelId = channelId || this.channelId;
    
    if (!targetChannelId) {
      throw new Error('No channel ID configured');
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId) as TextChannel;
      
      if (!channel || !channel.isTextBased()) {
        throw new Error('Invalid channel or not a text channel');
      }

      const messagePayload: any = {};

      if (options.content) {
        messagePayload.content = options.content;
      }

      if (options.embed) {
        const embed = new EmbedBuilder();
        
        if (options.embed.title) embed.setTitle(options.embed.title);
        if (options.embed.description) embed.setDescription(options.embed.description);
        if (options.embed.color) embed.setColor(options.embed.color);
        if (options.embed.fields) embed.addFields(options.embed.fields);
        if (options.embed.footer) embed.setFooter(options.embed.footer);
        if (options.embed.timestamp) embed.setTimestamp();

        messagePayload.embeds = [embed];
      }

      if (options.files) {
        messagePayload.files = options.files.map(file => new AttachmentBuilder(file));
      }

      const message = await channel.send(messagePayload);
      
      logger.info(`Discord message sent: ${message.id}`);
      return message.id;
    } catch (error) {
      logger.error('Failed to send Discord message:', error);
      throw error;
    }
  }

  /**
   * Send simple text message
   */
  async sendTextMessage(text: string, channelId?: string): Promise<string> {
    return this.sendMessage({ content: text }, channelId);
  }

  /**
   * Send embed message
   */
  async sendEmbed(
    title: string,
    description: string,
    color: number = 0x0099ff,
    channelId?: string
  ): Promise<string> {
    return this.sendMessage({
      embed: {
        title,
        description,
        color,
        timestamp: true,
      },
    }, channelId);
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, channelId?: string): Promise<void> {
    await this.waitForReady();

    const targetChannelId = channelId || this.channelId;
    
    if (!targetChannelId) {
      throw new Error('No channel ID configured');
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId) as TextChannel;
      const message = await channel.messages.fetch(messageId);
      await message.delete();
      
      logger.info(`Discord message deleted: ${messageId}`);
    } catch (error) {
      logger.error('Failed to delete Discord message:', error);
      throw error;
    }
  }

  /**
   * Pin message
   */
  async pinMessage(messageId: string, channelId?: string): Promise<void> {
    await this.waitForReady();

    const targetChannelId = channelId || this.channelId;
    
    if (!targetChannelId) {
      throw new Error('No channel ID configured');
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId) as TextChannel;
      const message = await channel.messages.fetch(messageId);
      await message.pin();
      
      logger.info(`Discord message pinned: ${messageId}`);
    } catch (error) {
      logger.error('Failed to pin Discord message:', error);
      throw error;
    }
  }

  /**
   * Get channel info
   */
  async getChannelInfo(channelId?: string): Promise<any> {
    await this.waitForReady();

    const targetChannelId = channelId || this.channelId;
    
    if (!targetChannelId) {
      throw new Error('No channel ID configured');
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      return channel;
    } catch (error) {
      logger.error('Failed to get channel info:', error);
      throw error;
    }
  }

  /**
   * Disconnect bot
   */
  async disconnect(): Promise<void> {
    this.client.destroy();
    logger.info('Discord bot disconnected');
  }
}
