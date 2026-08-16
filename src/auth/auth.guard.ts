import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/auth/public-route.decorator';
import { Request } from 'express';
import { AuthService } from '@/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        const request = context.switchToHttp().getRequest();
        const token = AuthGuard.extractTokenFromRequest(request);

        // A public route is open to everyone, but it should still know who is
        // asking when a usable token is present: routes like GET /cohorts serve
        // a role-gated projection, and returning early here would hand signed-in
        // members the anonymous view. A missing or invalid token simply means
        // anonymous, so it is never an error on this path.
        if (isPublic) {
            if (token) {
                try {
                    request['user'] =
                        await this.authService.getUserFromSession(token);
                } catch {
                    // Treat as anonymous; request.user stays unset.
                }
            }
            return true;
        }

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            request['user'] = await this.authService.getUserFromSession(token);
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }

    static extractTokenFromRequest(request: Request): string | undefined {
        const authHeader = request.headers['authorization'];
        if (!authHeader) return undefined;

        return AuthGuard.extractTokenFromHeader(authHeader);
    }

    static extractTokenFromHeader(authHeader: string): string | undefined {
        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
