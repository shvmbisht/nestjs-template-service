import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseDbResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
