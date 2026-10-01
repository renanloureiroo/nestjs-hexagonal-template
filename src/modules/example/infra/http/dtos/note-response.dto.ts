import { ApiProperty } from '@nestjs/swagger';

export class NoteResponseDTO {
  @ApiProperty({ example: 'f59dd6bb-e086-4fe9-a382-a00f8796d260' })
  readonly id: string;

  @ApiProperty({ example: 'Minha primeira nota' })
  readonly title: string;

  @ApiProperty({ example: '2026-09-26T12:00:00.000Z' })
  readonly createdAt: string;

  constructor(id: string, title: string, createdAt: string) {
    this.id = id;
    this.title = title;
    this.createdAt = createdAt;
  }
}
