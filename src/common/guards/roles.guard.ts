import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../enums/user-type.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../modules/account/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: User }>().user;

    if (!user || !requiredRoles.includes(user.userType)) {
      throw new ForbiddenException('Insufficient permissions for this resource');
    }

    return true;
  }
}
