import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountService } from './account.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponseDto,
  ProfileResponseDto,
} from './dto/profile-response.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './entities/user.entity';

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new patient or doctor account' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.accountService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.accountService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.accountService.getProfile(user.id);
  }
}
