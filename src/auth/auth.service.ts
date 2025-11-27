import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'


@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByEmail(email)

    if (user) {
      const userComparePassword = await bcrypt.compare(pass, user?.password)
      if (user && userComparePassword) {
        const { password, ...result } = user
        return result
      }
    }

    return null
  }

  async login(user: any) {
    const payload = {
        username: user.username,
        sub: user._id,
        accountType: user.accountType,
        country: user.country
    }

    return {
      acces_token: this.jwtService.sign(payload)
    }
  }
}
