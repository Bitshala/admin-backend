import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/public-route.decorator';

@ApiTags('App')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Public()
    @Get('/health')
    getHealth(): string {
        return this.appService.getHealth();
    }
}
