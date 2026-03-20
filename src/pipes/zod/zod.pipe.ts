import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try{
      const validate = this.schema.safeParse(value)
      if(!validate.success) return validate.error
      return value
    }catch(err){
      console.log(err)
    }
  }
}
