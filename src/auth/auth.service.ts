import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailerService,
  ) {}

  async register(name: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    return { id: user.id, name: user.name, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { error: 'Usuário não encontrado' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: 'Senha incorreta' };

    // Gera o OTP
    const otp = randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Expira em 10 minutos
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry },
    });

    await this.mail.sendOtpEmail([user.email], otp);

    return { message: 'OTP enviado para o email' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { error: 'Usuário não encontrado' };
    if (user.otpCode !== otp) return { error: 'OTP inválido' };
    if (user.otpExpiry && user.otpExpiry < new Date())
      return { error: 'OTP expirado' };
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    const refreshToken = this.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' },
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null },
    });
    return {
      access_token: token,
      refresh_token: refreshToken,
      refreshTokenExpiry: 7 * 24 * 60 * 60,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string }>(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) return { error: 'Usuário não encontrado' };
      const newToken = this.jwt.sign({ sub: user.id, email: user.email });
      const newRefreshToken = this.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '7d' },
      );
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: newRefreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return {
        access_token: newToken,
        refresh_token: newRefreshToken,
        refreshTokenExpiry: 7 * 24 * 60 * 60,
      };
    } catch {
      return { error: 'Refresh token inválido ou expirado' };
    }
  }
}

