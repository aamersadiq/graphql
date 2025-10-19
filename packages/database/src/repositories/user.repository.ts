import { PrismaClient, User, Role, UserRole } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export class UserRepository extends PrismaRepository<User, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findWithRoles(id: string): Promise<User & { roles: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Define the type for userRole
    type UserRoleWithRole = UserRole & { role: Role };

    return {
      ...user,
      roles: user.userRoles.map((ur: UserRoleWithRole) => ur.role.name),
    };
  }

  async createWithRole(data: Omit<User, 'id'>, roleName: string): Promise<User> {
    return this.prisma.$transaction(async (tx: PrismaClient) => {
      const user = await tx.user.create({
        data,
      });

      const role = await tx.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return user;
    });
  }
}