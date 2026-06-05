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
import { PatientProfileResponseDto } from './dto/patient-profile.dto';
import { User } from './entities/user.entity';

@ApiTags('Patient')
@Controller('patient')
export class PatientController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.Patient)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated patient profile' })
  @ApiOkResponse({ type: PatientProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Only patients can access this route' })
  getProfile(@CurrentUser() user: User): Promise<PatientProfileResponseDto> {
    return this.accountService.getPatientProfile(user.id);
  }
}
