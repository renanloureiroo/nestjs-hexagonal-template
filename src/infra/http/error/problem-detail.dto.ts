import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Contrato RFC 9457 publicado no OpenAPI para toda resposta de erro.
export class ProblemDetailDTO {
  @ApiPropertyOptional({ description: 'URI do tipo de problema; omitido quando é about:blank' })
  type?: string;

  @ApiProperty({ example: 'Not Found' })
  title!: string;

  @ApiProperty({ example: 404 })
  status!: number;

  @ApiProperty({ example: 'Nota não encontrada: f59dd6bb-e086-4fe9-a382-a00f8796d260' })
  detail!: string;

  @ApiProperty({ example: '/api/notes/f59dd6bb-e086-4fe9-a382-a00f8796d260' })
  instance!: string;

  @ApiProperty({ description: 'Código estável do erro', example: 'note.not_found' })
  code!: string;

  @ApiPropertyOptional({ example: '4bf92f3577b34da6a3ce929d0e0e4736' })
  traceId?: string;

  @ApiPropertyOptional({
    description: 'Erros por campo, presentes quando code é request.invalid',
    example: { title: 'Título é obrigatório' },
  })
  errors?: Record<string, string>;
}
