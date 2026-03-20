import { Body, Controller, Get, Post, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
import { GoogleGuard } from 'src/google/guard/google/google.guard';
import { JwtGuard } from 'src/jwt/guard/jwt/jwt.guard';
import { ZodPipe } from 'src/pipes/zod/zod.pipe';
import { UserService } from 'src/user/service/user/user.service';
import { ZodError } from 'zod';
import { type UserDto, type UserLoginDto, UserLoginSchema, UserSchema } from 'zod/user.schema';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('info')
    @UseGuards(JwtGuard)
    getUserInfo(@Req() request){
        return this.userService.getUserInfo(request.user.id!)
    }

    @Get('all')
    getAllUsers(){
        return this.userService.getAllUsers()
    }

    @Post('register')
    @UsePipes(new ZodPipe(UserSchema))
    register(@Body() body: UserDto){
        if(body instanceof ZodError) return this.userService.errorHandling(body)
        else return this.userService.register(body)
    }

    @Post('login')
    @UsePipes(new ZodPipe(UserLoginSchema))
    login(@Body() body: UserLoginDto, @Res({ passthrough: true }) response){
        if(body instanceof ZodError) return this.userService.errorHandling(body)
        else return this.userService.login(body, response)
    }

    @Post('google-login')
    @UseGuards(GoogleGuard)
    googleLogin(@Req() request, @Res({ passthrough: true }) response){
        return this.userService.googleLogin(request.user!, response)
    }
}
