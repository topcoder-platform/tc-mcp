import { IsInt, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfigEnv {
  @IsInt()
  @IsOptional()
  PORT = 3000;

  @IsString()
  TOPCODER_API_BASE_URL!: string;

  @IsString()
  AUTH0_M2M_TOKEN_URL!: string;

  @IsString()
  AUTH0_M2M_AUDIENCE!: string;

  @IsString()
  AUTH0_CLIENT_ID!: string;

  @IsString()
  @IsOptional()
  API_BASE = '/v6/mcp';

  // Azure AD Config

  @IsString()
  AZURE_AD_AUDIENCE!: string;

  @IsString()
  AZURE_AD_TENANT_ID!: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  IS_SAME_AZURE_AD_TENANT = false;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  MOCK_AZURE_AD_VALIDATION = false;

  // LLM for Agent
  @IsString()
  AWS_ACCESS_KEY_ID!: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY!: string;

  @IsString()
  AWS_BEDROCK_REGION = 'us-east-1';

  @IsString()
  AWS_BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  @IsString()
  MONGO_DB_URL!: string;
}
