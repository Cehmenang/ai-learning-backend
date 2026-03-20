import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { extname } from 'path';
import { DocumentService } from 'src/document/service/document/document.service';
import { JwtGuard } from 'src/jwt/guard/jwt/jwt.guard';
import { SupabaseService } from 'src/supabase/service/supabase/supabase.service';

@Controller('document')
export class DocumentController {
    constructor(private readonly documentService: DocumentService, private readonly supabaseService: SupabaseService){}

    @Get('count')
    @UseGuards(JwtGuard)
    async getAllCount(@Req() request){
        return await this.documentService.getAllCount(request.user.id!)
    }

    @Get()
    @UseGuards(JwtGuard)
    async getDocuments(@Req() request){
        return await this.documentService.getDocuments(request.user!)
    }

    @Get(':id')
    @UseGuards(JwtGuard)
    async getDocumentById(@Param('id') id: string, @Req() request){
        return await this.documentService.getDocumentById(id, request.user!.id)
    }

    @Post('ask/:id')
    @UseGuards(JwtGuard)
    async askQuestion(@Param("id") id: string, @Body() {question}: { question: string }){
        const relevant = await this.supabaseService.searchSimilarity(question, id)
        return await this.documentService.askQuestion(question, relevant!)
    }

    @Post('upload')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('document', {
        fileFilter(req, file, callback) {
            const ext = extname(file.originalname)
            if(ext.split('.')[1] !== "pdf") return callback(new Error("File tidak sesuai!"), false)
            return callback(null, true)
        },
    }))
    async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() request){
        try{
            const supabase = await this.supabaseService.uploadFile(file)
            const result = await this.documentService.create(supabase, request.user!)
            await this.supabaseService.saveChunk(file, result!.document.id)
            return result
        }catch(err){
            console.log(err)
        }
    }

    @Delete(':id')
    @UseGuards(JwtGuard)
    deleteDocument(@Param('id') id: string, @Req() request){
        return this.documentService.deleteDocument(id, request.user!.id)
    }

    @Get('admin/all')
    async getAllDocument(){
        return await this.documentService.getAllDocument()
    }
}
