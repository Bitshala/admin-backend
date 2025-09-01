import { Controller, Get, Post, Query, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/auth/public-route.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/auth/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Get('discord')
    async discord(@Res() res: Response) {
        const url = await this.authService.buildAuthorizeUrl();
        return res.redirect(url);
    }

    @Public()
    @Get('discord/callback')
    async discordCallback(
        @Query('code') code: string | undefined,
        @Query('state') state: string | undefined,
        @Res() res: Response,
    ) {
        const sessionId = await this.authService.createSessionFromDiscord(
            state,
            code,
        );

        const url = this.authService.buildDashboardUrl(sessionId);
        return res.redirect(url);
    }

    @Post('/logout')
    @ApiBearerAuth()
    async logout(@Headers('authorization') authHeader: string) {
        const sessionId = AuthGuard.extractTokenFromHeader(authHeader);
        if (sessionId) {
            await this.authService.destroySession(sessionId);
        }
    }
}
