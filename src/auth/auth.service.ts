import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDTO } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(body: AuthDTO) {
    try {
      const hashPassword = await argon.hash(body.password);
      const user = await this.prismaService.user.create({
        data: {
          username: body.username,
          password: hashPassword,
          name: '',
        },
        select: {
          id: true,
          username: true,
        },
      });
      return this.signJWT(user.id, user.username);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Account already exists!');
      }
    }
  }

  async login(body: AuthDTO) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          username: body.username,
        },
      });
      if (!user) {
        throw new ForbiddenException('User does not exist!');
      }

      const checkPassword = await argon.verify(user.password, body.password);
      if (!checkPassword) {
        throw new ForbiddenException('Incorrect password!');
      }

      delete user.password;
      return await this.signJWT(user.id, user.username);
    } catch (error) {
      return error.response;
    }
  }

  async signJWT(userId: number, username: string): Promise<{ token: string }> {
    const payload = {
      sub: userId,
      username,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '10m',
      secret: this.configService.get('JWT_SECRET'),
    });
    return { token };
  }
}
