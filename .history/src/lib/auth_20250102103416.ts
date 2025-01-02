import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: any) => {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
        image: data.image,
        username: data.username,
      },
    });
    return user;
  },
}; 