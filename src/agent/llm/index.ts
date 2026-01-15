import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TopcoderMCPClient } from './tools/tc-mcp';
import { ZayoMcpClient } from './tools/zayo-mcp';
import { StateGraph, START, END } from '@langchain/langgraph';
import { createTopcoderNode } from './agents/topcoder.agent';
import { createZayoServiceNode } from './agents/zayo-services.agent';
import { createZayoQuoteNode } from './agents/zayo-quotes.agent';
import { createSupervisorNode } from './agents/supervisor.agent';
import { GraphState } from './agents/graph-state';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly tcMcpClient: TopcoderMCPClient,
    private readonly zayoMcpClient: ZayoMcpClient,
  ) {}

  async onModuleInit() {}

  async createConversationalAgent(userId: string) {
    const tcTools = this.tcMcpClient.getTools();
    const zayoServiceTools = this.zayoMcpClient.getServiceTools();
    const zayoQuoteTools = this.zayoMcpClient.getQuoteTools();

    // 1. Create Nodes
    const topcoderNode = createTopcoderNode(tcTools);
    const zayoServiceNode = createZayoServiceNode(zayoServiceTools);
    const zayoQuoteNode = createZayoQuoteNode(zayoQuoteTools);
    const supervisorNode = createSupervisorNode();

    // 2. Build Graph
    const workflow = new StateGraph(GraphState)
      .addNode('supervisor', supervisorNode)
      .addNode('TopcoderAgent', topcoderNode)
      .addNode('ZayoServiceAgent', zayoServiceNode)
      .addNode('ZayoQuoteAgent', zayoQuoteNode);

    const members = [
      'TopcoderAgent',
      'ZayoServiceAgent',
      'ZayoQuoteAgent',
    ] as const;

    members.forEach((member) => {
      workflow.addEdge(member, 'supervisor');
    });

    workflow.addEdge(START, 'supervisor');

    workflow.addConditionalEdges('supervisor', (x: any) => x.next, {
      TopcoderAgent: 'TopcoderAgent',
      ZayoServiceAgent: 'ZayoServiceAgent',
      ZayoQuoteAgent: 'ZayoQuoteAgent',
      FINISH: END,
    });

    return workflow.compile();
  }

  getTools() {
    return [...this.tcMcpClient.getTools(), ...this.zayoMcpClient.getTools()];
  }
}
