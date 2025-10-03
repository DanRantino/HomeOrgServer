import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {

    @Get('profile')
    getProfile() {
        return { message: 'This is a protected user profile endpoint.' };
    }

}
 