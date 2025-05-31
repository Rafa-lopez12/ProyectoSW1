import { IsUUID } from 'class-validator';

export class CheckStatusDto {
  @IsUUID()
  sessionId: string;
}