import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../utils/logger';

export interface TelegramConfig {
  botToken: string;
  channelId?: string;
}

export interface MessageOptions {
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  disablePreview?: boolean;
  replyToMessageId?: number;
}

export class TelegramService {
  private bot: TelegramBot;
  private channelId: string | null = null;

  constructor(config: TelegramConfig) {
    this.bot = new TelegramBot(config.botToken, { polling: false });
    this.channelId = config.channelId || null;
  }

  /**
   * Initialize and verify bot
   */
  async initialize(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      logger.info(`Telegram bot initialized: @${me.username}`);
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      throw new Error('Telegram bot authentication failed');
    }
  }

  /**
   * Send message to channel
   */
  async sendMessage(options: MessageOptions, chatId?: string): Promise<number> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      const message = await this.bot.sendMessage(targetChatId, options.text, {
        parse_mode: options.parseMode,
        disable_web_page_preview: options.disablePreview,
        reply_to_message_id: options.replyToMessageId,
      });

      logger.info(`Telegram message sent: ${message.message_id}`);
      return message.message_id;
    } catch (error) {
      logger.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  /**
   * Send photo to channel
   */
  async sendPhoto(photoPath: string, caption?: string, chatId?: string): Promise<number> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      const message = await this.bot.sendPhoto(targetChatId, photoPath, {
        caption,
      });

      logger.info(`Telegram photo sent: ${message.message_id}`);
      return message.message_id;
    } catch (error) {
      logger.error('Failed to send Telegram photo:', error);
      throw error;
    }
  }

  /**
   * Send document to channel
   */
  async sendDocument(documentPath: string, caption?: string, chatId?: string): Promise<number> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      const message = await this.bot.sendDocument(targetChatId, documentPath, {
        caption,
      });

      logger.info(`Telegram document sent: ${message.message_id}`);
      return message.message_id;
    } catch (error) {
      logger.error('Failed to send Telegram document:', error);
      throw error;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: number, chatId?: string): Promise<void> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      await this.bot.deleteMessage(targetChatId, messageId.toString());
      logger.info(`Telegram message deleted: ${messageId}`);
    } catch (error) {
      logger.error('Failed to delete Telegram message:', error);
      throw error;
    }
  }

  /**
   * Pin message
   */
  async pinMessage(messageId: number, chatId?: string): Promise<void> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      await this.bot.pinChatMessage(targetChatId, messageId.toString());
      logger.info(`Telegram message pinned: ${messageId}`);
    } catch (error) {
      logger.error('Failed to pin Telegram message:', error);
      throw error;
    }
  }

  /**
   * Get channel info
   */
  async getChannelInfo(chatId?: string): Promise<any> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      const chat = await this.bot.getChat(targetChatId);
      return chat;
    } catch (error) {
      logger.error('Failed to get channel info:', error);
      throw error;
    }
  }

  /**
   * Get channel member count
   */
  async getMemberCount(chatId?: string): Promise<number> {
    const targetChatId = chatId || this.channelId;
    
    if (!targetChatId) {
      throw new Error('No chat ID or channel ID configured');
    }

    try {
      const count = await this.bot.getChatMemberCount(targetChatId);
      return count;
    } catch (error) {
      logger.error('Failed to get member count:', error);
      throw error;
    }
  }
}
