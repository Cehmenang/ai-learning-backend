import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma/prisma.service';

@Injectable()
export class AttemptService {
    constructor(private readonly prismaService: PrismaService){}

    async getAttemptsByQuiz(quizId: string, userId: string){
        return await this.prismaService.attempt.findMany({ where: { quizId, userId }, include: { quiz: { select: { title: true } }, userAnswers: { include: { selectedOption: true } } } })
    }

    async getAttemptById(id: string, userId: string){
        return await this.prismaService.attempt.findFirst({ where: { id, userId }, include: { userAnswers: { include: { selectedOption: true, question: { include: { options: true } } } } } } )
    }
}
