import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/jwt/guard/jwt/jwt.guard';
import { QuizService } from 'src/quiz/service/quiz/quiz.service';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService){}

    @Get('generate/:id')
    @UseGuards(JwtGuard)
    async generateQuiz(@Param('id') id: string, @Req() request){
        return await this.quizService.generateQuiz(id, request.user.id!)
    }

    @Get('document/:id')
    @UseGuards(JwtGuard)
    async getQuizzesByDocument(@Param('id') id: string, @Req() request){
        return await this.quizService.getQuizzesByDocument(id, request.user!.id)
    }

    @Get(':id/document/:documentId')
    @UseGuards(JwtGuard)
    async getQuizByDocument(@Param('id') id: string, @Param('documentId') documentId: string, @Req() request){
        return await this.quizService.getQuizByDocument(id, documentId, request.user.id)
    }

    @Post(':id/attempt')
    @UseGuards(JwtGuard)
    async createAttempt(@Param('id') id: string, @Body() body, @Req() req){
        return await this.quizService.createAttempt(id, body, req.user.id)
    }
}
