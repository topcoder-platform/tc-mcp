import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { HistoryService } from './history.service';
  import { User } from 'src/core/auth/decorators';
import { AzureAdGuard } from 'src/core/auth/guards/azureAd.guard';
  
  @Controller('agent/history')
  @UseGuards(AzureAdGuard)
  export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}
  
    @Get()
    async getHistory(
      @User('oid') userId: string,
      @Query('filter') filter?: string,
      @Query('search') search?: string,
    ) {
      if (!userId) {
        throw new UnauthorizedException('User identifier is missing from token.');
      }
      return this.historyService.getHistoryList(userId, filter, search);
    }
  
    @Get(':sessionId')
    async getConversation(
      @User('oid') userId: string,
      @Param('sessionId') sessionId: string,
    ) {
      if (!userId) {
        throw new UnauthorizedException('User identifier is missing from token.');
      }
  
      const conversation = await this.historyService.getConversationDetails(
        userId,
        sessionId,
      );
  
      if (!conversation) {
        throw new NotFoundException(
          'Conversation not found or you do not have permission to view it.',
        );
      }
      return conversation;
    }
  }