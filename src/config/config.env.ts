import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from './boolean.decorator';

export class ConfigEnv {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsOptional()
  API_BASE = '/v6/mcp';

  @IsString()
  TOPCODER_API_BASE_URL!: string;

  @IsString()
  AUTH0_M2M_TOKEN_URL!: string;

  @IsString()
  AUTH0_M2M_AUDIENCE!: string;

  @IsString()
  AUTH0_CLIENT_ID!: string;

  @IsString()
  ZAYO_MCP_MGMT_URL!: string;

  @IsString()
  ZAYO_MCP_CLIENT_ID!: string;

  @IsString()
  ZAYO_MCP_CLIENT_SECRET!: string;

  @IsString()
  ZAYO_MCP_SERVER_URL: string = 'http://localhost:8012/mcp';

  @ToBoolean()
  @IsOptional()
  ZAYO_MCP_ENABLED = true;

  @IsString()
  @IsOptional()
  ZAYO_MCP_SESSION_ID?: string;

  // Azure AD Config
  @IsString()
  AZURE_AD_AUDIENCE!: string;

  @IsString()
  AZURE_AD_TENANT_ID!: string;

  @ToBoolean()
  @IsOptional()
  IS_SAME_AZURE_AD_TENANT = false;

  @ToBoolean()
  @IsOptional()
  MOCK_AZURE_AD_VALIDATION = false;

  // LLM for Agent
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  AWS_BEDROCK_REGION = 'us-east-1';

  @IsString()
  AWS_BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  @IsString()
  MONGO_DB_URL!: string;

  @ToBoolean()
  @IsOptional()
  MONGO_IN_SSH_TUNNEL = false;

  @ToBoolean()
  @IsOptional()
  MONGO_IS_DOCUMENTDB = false;
}
