import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma/prisma.service';
import { ZodError } from 'zod';
import * as bcrypt from 'bcrypt';
import { UserDto, UserLoginDto } from 'zod/user.schema';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService, private readonly jwtService: JwtService) {}

    errorHandling(err: ZodError){
        return { status: HttpStatus.BAD_REQUEST, error: err.issues }
    }

    async getUserInfo(id: string){
        const user = await this.prismaService.user.findFirst({ where: { id } }) as User
        return { username: user.username, email: user.email }
    }

    signToken({ username, id }: { username: string, id: string }, response: Response){
        const token = this.jwtService.sign({ id, username})
        response.cookie('access_token', token, { httpOnly: true, secure: false, maxAge: 1000 * 3600 })
        return token
    }

    async register(body: UserDto){
        try{
            await this.prismaService.user.create({
                data: { ...body, password: await bcrypt.hash(body.password, 10)}
            })
            return { status: HttpStatus.ACCEPTED, message: "User created successfully" }
        }catch(err){
            console.log(err)
        }
    }

    async login(body: UserLoginDto, response: Response){
        try{
            const user = await this.prismaService.user.findFirst({ where: { username: body.username } })
            if(!user) throw new BadRequestException("User tidak ditemukan!")
            const isPasswordValid = await bcrypt.compare(body.password, user.password)
            if(!isPasswordValid) throw new BadRequestException("Password salah!")
            const token = this.signToken({ username: user.username, id: user.id }, response)
            return { status: HttpStatus.OK, message: "Login successful", token }
        }catch(err){ console.log(err) }
    }

    async googleLogin({ email, name, sub }: { email: string, name: string, sub: string }, response: Response){
        try {
            let user = await this.prismaService.user.findFirst({ where: { email } })
            if(!user) user = await this.prismaService.user.create({ data: { username: name, email, googleId: sub } })
            const token = this.signToken({ username: user.username, id: user.id }, response)
            return { status: HttpStatus.OK, message: "Login successful", token }
        }catch(err){

        }
    }

    async getAllUsers() {
        return this.prismaService.user.findMany();
    }
}
