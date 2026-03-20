import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AttemptService } from 'src/attempt/service/attempt/attempt.service';
import { JwtGuard } from 'src/jwt/guard/jwt/jwt.guard';

@Controller('attempt')
export class AttemptController {
    constructor(private readonly attemptService: AttemptService){}

    @Get('/quiz/:quizId')
    @UseGuards(JwtGuard)
    async getAttemptsByQuiz(@Param('quizId') quizId: string, @Req() request){
        return await this.attemptService.getAttemptsByQuiz(quizId, request.user.id)
    }

    @Get(':id')
    @UseGuards(JwtGuard)
    async getAttemptById(@Param('id') id: string, @Req() request){
        return await this.attemptService.getAttemptById(id, request.user.id)
    }
}
