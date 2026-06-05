import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return {
    jwtSecret: jwtSecret ?? 'dev-only-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  };
});
