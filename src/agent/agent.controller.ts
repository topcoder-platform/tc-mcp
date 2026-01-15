import {
  Controller,
  Get,
  Post,
  Body,
  Sse,
  UseGuards,
  Req,
  MessageEvent,
  Res,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { AgentService } from './agent.service';

import { User } from 'src/core/auth/decorators';
import { AzureAdGuard } from 'src/core/auth/guards/azureAd.guard';

interface ChatRequestBody {
  prompt: string;
  sessionId?: string;
}

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('tools')
  getTools() {
    return this.agentService.getTools();
  }

  @Post('chat')
  @UseGuards(AzureAdGuard)
  chat(
    @Body() body: ChatRequestBody,
    @User('oid') userId: string, // Using a custom decorator to get the user's OID
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { prompt, sessionId } = body;

    if (!userId) {
      // This logic could also be in the AuthGuard
      throw new Error('User identifier is missing from token.');
    }

    return this.agentService.runAgent(prompt, userId, req, res, sessionId);
  }
}