import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma/prisma.service';
import { ChatOpenAI } from '@langchain/openai'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentService {
    private readonly openAI: ChatOpenAI

    constructor(private readonly prismaService: PrismaService, private readonly configService: ConfigService){
        this.openAI =  new ChatOpenAI({
                apiKey: this.configService.get<string>('OPENROUTER_KEY'),
                configuration: { baseURL: 'https://openrouter.ai/api/v1' },
                modelName: 'stepfun/step-3.5-flash:free',
                maxRetries: 5
        })
    }

    async getAllCount(userId: string){
        const [ documents, quizzes, attempts ] = await Promise.all([
            this.prismaService.document.count({ where: { userId } }),
            this.prismaService.quiz.count({ where: { userId } }),
            this.prismaService.attempt.count({ where: { userId } })
         ])
         return { documents, quizzes, attempts }
    }

    async getDocumentById(id: string, userId: string) {
        const document = await this.prismaService.document.findFirst({ 
            where: { id, userId } 
        }) as any

        if (!document) {
            throw new NotFoundException('Document tidak ditemukan')
        }

        document.size = document.size.toString()
        return { status: HttpStatus.ACCEPTED, document }
    }

    async deleteDocument(id: string, userId: string){
        await this.prismaService.document.deleteMany({ where: { id, userId } })
        const documents = await this.getDocuments({ id: userId })
        return { status: HttpStatus.ACCEPTED, documents }
    }

    async getDocuments({ id }){
        let documents = await this.prismaService.document.findMany({ where: { userId: id }, include: { user: true, quizzes: true } }) as any
        documents = documents.map(doc=>({ ...doc, size: doc.size.toString() }))
        return { status: HttpStatus.ACCEPTED, documents}
    }

    async askQuestion(question: string, relevant){
        try{
            const context = relevant.map(ctx=>ctx.content).join("\n\n")
            const prompt = `Please answer the following user question according to the context:
            Question: ${question}
            Context: ${context}
            Could you please answer in Bahasa?`
            // const result = await this.openAI.invoke(prompt)
            return { status: HttpStatus.ACCEPTED, prompt }
        }catch(err){ console.log(err) }
    }

    async create(supabase: { url: string , title: string, filename: string, size: number }, user){
        try{
            const document = await this.prismaService.document.create({
                data: { title: supabase.title, content: supabase.url, size: supabase.size, fileName: supabase.filename , userId: user.id }
            })
            const result = { status: HttpStatus.ACCEPTED, document: { ...document, size: document.size.toString() } }
            return result
        }catch(err){ console.log(err) }
    }

    async getAllDocument(){
        let documents = await this.prismaService.document.findMany() as any
        documents = documents.map(doc=>({ ...doc, size: doc.size.toString() }))
        return documents
    }
}
