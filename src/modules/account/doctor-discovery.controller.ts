import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../../common/enums/user-type.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import {
  DoctorDetailResponseDto,
  DoctorListResponseDto,
  ListDoctorsQueryDto,
} from './dto/doctor-list.dto';
import { DoctorsService } from './doctors.service';

@ApiTags('Doctor Discovery')
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.Patient)
@ApiBearerAuth('access-token')
export class DoctorDiscoveryController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Discover doctors with search, filters, and pagination',
  })
  @ApiOkResponse({ type: DoctorListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  listDoctors(
    @Query() query: ListDoctorsQueryDto,
  ): Promise<DoctorListResponseDto> {
    return this.doctorsService.listDoctors(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor profile details by ID' })
  @ApiOkResponse({ type: DoctorDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Patient role required' })
  @ApiNotFoundResponse({ description: 'Doctor not found' })
  getDoctorById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorDetailResponseDto> {
    return this.doctorsService.getDoctorById(id);
  }
}
