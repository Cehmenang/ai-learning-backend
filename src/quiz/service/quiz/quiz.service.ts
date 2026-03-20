import { ChatOpenAI } from '@langchain/openai';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Difficulty } from '@prisma/client';
import { PrismaService } from 'src/prisma/service/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/service/supabase/supabase.service';

@Injectable()
export class QuizService {
    private readonly groq: ChatOpenAI

    constructor(private readonly supabaseService: SupabaseService, private readonly configService: ConfigService, private readonly prismaService: PrismaService){
        this.groq = new ChatOpenAI({
            apiKey: this.configService.get<string>('GROQ_KEY'),
            configuration: { baseURL: 'https://api.groq.com/openai/v1' },
            modelName: 'llama-3.3-70b-versatile',
            maxRetries: 5
        })
    }

    pickDiverseChunks(chunks, count: number){
        const selected = [] as { content: string }[]
        const step = Math.round(chunks.length/count)
        for (let i = 0; i < count; i++) {
            const startWindow = i * step;
            const endWindow = (i + 1) * step - 1;
            const randomIndex = Math.floor(Math.random() * (endWindow - startWindow + 1)) + startWindow;
            selected.push(chunks[randomIndex]);
        }
        const context = selected.map(c => c.content).join("\n\n")
        return context
    }

    async getQuizzesByDocument(documentId, userId){
        const quizzes = await this.prismaService.quiz.findMany({ where: { userId, documentId }, include: { questions: true, attempts: true } })
        return { status: HttpStatus.ACCEPTED, quizzes }
    }

    async createQuiz({ title, description, quiz }, id: string, userId: string){
        await this.prismaService.quiz.create({ data: { title, description, userId, documentId: id, questions: { create: quiz.map(q=>({
            text: q.question,
            answer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty as Difficulty,
            options: {
                create: q.options.map(opt=>({
                    text: opt,
                    isCorrect: opt == q.answer ? true : false
                }))
             }

        })) } } })
        return { status: HttpStatus.ACCEPTED }
    }

    async getQuizByDocument(id: string, documentId: string, userId: string){
        const quiz = await this.prismaService.quiz.findFirst({ where: { id, documentId, userId }, include: { questions: { include: { options: true } } } })
        return { status: HttpStatus.ACCEPTED, quiz }
    }

    async generateQuiz(id: string, userId: string){
        const chunks = await this.supabaseService.getQualityChunks(id)
        const context = this.pickDiverseChunks(chunks, 5)
        let prompt = `
            Kamu adalah instruktur kuis profesional. 
            Tugas: Buatlah 5 soal pilihan ganda berdasarkan konteks yang diberikan, berikan judul beserta deskripsi yang relevan untuk keseluruhan quiz.
            Seed: ${Math.random()}
            Konteks : ${context}

            ATURAN KETAT:
            1. Pilih konsep yang paling unik, teknis, atau jarang dibahas.
            2. Setiap soal harus punya 4 pilihan jawaban (A, B, C, D) dengan hanya 1 jawaban benar.
            3. Gunakan Bahasa Indonesia yang formal dan mudah dipahami.
            4. Buat 5 Soal dibagi berdasarkan tingkat kesulitan, 2 soal mudah, 2 soal sedang, dan 1 soal sulit. 
            5. JANGAN berikan teks pembuka atau penutup. Kembalikan HANYA JSON.

            STRUKTUR JSON:
            {
                "title": "Judul Quiz",
                "description": "Deskripsi Quiz",
                "quiz": [
                    {
                    "question": "teks pertanyaan",
                    "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
                    "answer": "pilihan yang benar (harus sama persis dengan salah satu di options)",
                    "explanation": "penjelasan singkat kenapa jawaban itu benar",
                    "difficulty": [MUDAH/MENENGAH/SULIT]
                    }
                ]
            }
            `

        prompt = prompt + "PENTING: Pastikan output hanya berupa string JSON yang valid. Dilarang menggunakan newline (enter) yang tidak ter-escape atau karakter kontrol tersembunyi di dalam nilai JSON. Jangan gunakan pembungkus markdown seperti ` ` `json."

        const result = await this.groq.invoke(prompt)
        return this.createQuiz(JSON.parse(result.content as string), id, userId)
    }

    async createAttempt(quizId: string, { questionsId, optionsId, score }: { questionsId: string[], optionsId: string[], score: number }, userId: string){
        const hasil = await this.prismaService.attempt.create({ data: { userId, quizId, score, userAnswers: {
            create: questionsId.map((q: string, index: number)=>
                ({
                    question: { connect: { id: q } },
                    selectedOption: { connect: { id: optionsId[index] } },
                })
            )
        } } })
        return hasil
    }
}
