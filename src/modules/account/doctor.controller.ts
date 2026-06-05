import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../../common/enums/user-type.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountService } from './account.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { DoctorProfileResponseDto } from './dto/doctor-profile.dto';
import { User } from './entities/user.entity';

@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.Doctor)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated doctor profile' })
  @ApiOkResponse({ type: DoctorProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Only doctors can access this route' })
  getProfile(@CurrentUser() user: User): Promise<DoctorProfileResponseDto> {
    return this.accountService.getDoctorProfile(user.id);
  }
}
