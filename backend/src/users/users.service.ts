import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/decorators/roles.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdWithSecrets(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.userModel
      .findById(id)
      .select('+passwordHash +refreshToken +emailVerificationToken +passwordResetToken +passwordResetExpires');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash');
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash?: string;
    role?: UserRole;
    image?: string;
    emailVerified?: boolean;
    emailVerificationToken?: string;
    googleId?: string;
    isEmailVerified?: boolean;
  }): Promise<UserDocument> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = new this.userModel(data);
    return user.save();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    const hash = token ? await bcrypt.hash(token, 10) : null;
    await this.userModel.findByIdAndUpdate(id, { $set: { refreshToken: hash } });
  }

  async setEmailVerified(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $set: { emailVerified: true, emailVerificationToken: null },
    });
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $set: { passwordResetToken: token, passwordResetExpires: expires },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $set: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setActive(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $set: { lastLoginAt: new Date() },
    });
  }

  async findAll(
    page = 1,
    limit = 20,
    role?: UserRole,
    search?: string,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const query: any = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.userModel.countDocuments(query),
    ]);

    return { users, total };
  }
}
