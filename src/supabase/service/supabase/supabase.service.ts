import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { TaskType } from '@google/generative-ai'

@Injectable()
export class SupabaseService {
    private readonly client: SupabaseClient
    private readonly embeddingModel: GoogleGenerativeAIEmbeddings

    constructor(private readonly configService: ConfigService){
        this.client = createClient(this.configService.get<string>("SUPABASE_URL")!, this.configService.get<string>("ANON_KEY")!)
        this.embeddingModel = new GoogleGenerativeAIEmbeddings({
            apiKey: this.configService.get<string>('GENAPI_KEY'),
            modelName: 'gemini-embedding-001',
        })
    }

    async searchSimilarity(question: string, id: string){
        try{
            const queryEmbedding = await this.embeddingModel.embedQuery(question)
            const { data, error } = await this.client.rpc('search_v4_document', {
                filter: { documentId: id },
                match_count: 3,
                query_embedding: queryEmbedding
            });

            if (error) {
                console.error("RPC Error:", error.message);
                return [];
            }

            return data
        }catch(err){ console.log(err) }
    }

    async saveChunk(file: Express.Multer.File, documentId: string){
        try{
            const buffer = new PDFParse(new Uint8Array(file.buffer))
            const raw = await buffer.getText()
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
            const chunks = await splitter.createDocuments([raw.text], [{ documentId }])
            const validChunks = chunks.filter(chunk=>chunk.pageContent && chunk.pageContent.trim().length > 0)

            const embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: this.configService.get<string>('GENAPI_KEY'),
                modelName: "gemini-embedding-001",
                taskType: TaskType.RETRIEVAL_DOCUMENT,
            })

            const batchSize = 50
            for(let i = 0; i < validChunks.length; i += batchSize){
                const batch = validChunks.slice(i, i + batchSize)

                try{
                    const docsToInsert = await Promise.all(batch.map(async (doc) => {
                        const embedding = await embeddings.embedQuery(doc.pageContent);
                        return {
                            content: doc.pageContent,
                            metadata: doc.metadata,
                            embedding: embedding
                        };
                    }))
                    const {data, error} = await this.client.from('chunks').insert(docsToInsert)

                    if (error) {
                         console.error("Gagal Insert Batch:", error.message);
                        throw error;
                    }

                    return { status: HttpStatus.ACCEPTED }
                }catch(err){ console.log(err) }
            }
        }catch(err){
            console.log(err)
        }
    }

    async uploadFile(file: Express.Multer.File){

        const filename = `${Date.now()}-${file.originalname}`
        const { data, error } = await this.client.storage.from('documents')
            .upload(filename, file.buffer, {
                contentType: "application/pdf",
                upsert: false
            })

        if(error) throw error

        const supabaseRes = this.client.storage.from('documents')
            .getPublicUrl(filename)

        return {
            url: supabaseRes.data.publicUrl,
            title: file.originalname,
            filename,
            size: file.size
        }
    }

    async getQualityChunks(id: string){
        const {data, error} = await this.client.from('chunks')
            .select('content')
            .eq('metadata->>documentId', id)
        const filteredChunks = data!.filter(chunk => chunk.content.length > 500)
        return filteredChunks
    }
}

