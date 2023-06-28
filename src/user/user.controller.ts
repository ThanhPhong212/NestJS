import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('v1/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/profile')
  profile() {
    return this.userService.profile();
  }

  updateUser() {
    return this.userService.updateUser();
  }
}
