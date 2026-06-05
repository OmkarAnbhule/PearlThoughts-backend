import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../../common/enums/user-type.enum';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;
}
