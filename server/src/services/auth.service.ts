import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';
import type { User, UserRole } from '../types/domain.types.js';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  propertyId?: string | null;
}

export interface AuthSession {
  user: Omit<User, 'passwordHash'>;
  accessToken: string; // 15-minute in-memory JWT
  refreshToken: string; // 7-day secure HTTP-only cookie token
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  propertyId?: string | null;
  preferredLanguage?: 'en' | 'es';
}

export class AuthService {
  // 1. Generate 15-minute In-Memory Access Token
  public generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      propertyId: user.propertyId,
    };

    return jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: '15m',
    } as jwt.SignOptions);
  }

  // 2. Generate 7-Day Secure Refresh Token
  public generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      propertyId: user.propertyId,
    };

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: '7d',
    } as jwt.SignOptions);
  }

  // 3. Verify Access Token
  public verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtAccessSecret) as TokenPayload;
    } catch {
      throw new ApiError(401, 'Invalid or expired authentication session');
    }
  }

  // 4. Verify 7-Day Refresh Token
  public verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
    } catch {
      throw new ApiError(401, 'Refresh session expired or invalid. Please sign in again.');
    }
  }

  // 5. Real Login with Bcrypt Password Hash Verification & Fallback
  public login(email: string, password: string): AuthSession {
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.findOne(u => u.email?.trim().toLowerCase() === cleanEmail);
    if (!user) {
      console.warn(`[AUTH] Login failed: No user found for "${cleanEmail}". Total users in DB: ${db.users.count()}`);
      throw new ApiError(401, 'Invalid email or password');
    }

    const storedHash = user.passwordHash || (user as any).password;
    if (!storedHash) {
      console.warn(`[AUTH] Login failed: User "${cleanEmail}" has neither passwordHash nor password`);
      throw new ApiError(401, 'Invalid email or password');
    }

    let isMatch = false;
    try {
      if (typeof storedHash === 'string' && (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$'))) {
        isMatch = bcrypt.compareSync(password, storedHash);
      } else {
        isMatch = password === storedHash;
      }
    } catch {
      isMatch = password === storedHash;
    }

    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Password verification failed for "${cleanEmail}"`);
      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  // 6. Real User Registration with Bcrypt Hashing
  public register(input: RegisterInput): AuthSession {
    const existing = db.users.findOne(u => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new ApiError(409, 'An account with this email address already exists.');
    }

    const passwordHash = bcrypt.hashSync(input.password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: input.role || 'guest',
      propertyId: input.propertyId || null,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: input.preferredLanguage || 'en',
      createdAt: now,
    };

    db.users.insert(newUser);

    // If guest role, also create/link Guest CRM profile
    if (newUser.role === 'guest') {
      const nameParts = input.name.trim().split(' ');
      const firstName = nameParts[0] || 'Valued';
      const lastName = nameParts.slice(1).join(' ') || 'Guest';

      db.guests.insert({
        id: `gst_${userId}`,
        firstName,
        lastName,
        email: newUser.email,
        phone: input.phone || '+1 (555) 000-0000',
        city: 'Denver',
        state: 'CO',
        country: 'USA',
        loyaltyTier: 'member',
        loyaltyPoints: 500,
        idDocumentType: null,
        idDocumentNumber: null,
        specialPreferences: null,
        notes: 'Self-registered guest account',
        vipStatus: false,
        createdAt: now,
      });
    }

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, accessToken, refreshToken };
  }

  // 7. Token Refresh Rotation
  public refresh(refreshToken: string): AuthSession {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = this.getCurrentUser(payload.id);

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    const { passwordHash: _, ...safeUser } = user;
    return {
      user: safeUser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public getCurrentUser(userId: string): User {
    const user = db.users.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }
    return user;
  }
}

export const authService = new AuthService();
