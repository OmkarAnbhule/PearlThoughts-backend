import { User } from './entities/user.entity';
import { UserSummaryDto } from './dto/profile-response.dto';

export function toUserSummary(user: User): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    userType: user.userType,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}
