import { UserType } from '../../../common/enums/user-type.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: UserType;
}
