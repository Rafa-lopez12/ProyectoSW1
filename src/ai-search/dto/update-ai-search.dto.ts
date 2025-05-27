import { PartialType } from '@nestjs/swagger';
import { SearchByImageDto } from './create-ai-search.dto';

export class UpdateAiSearchDto extends PartialType(SearchByImageDto) {}
