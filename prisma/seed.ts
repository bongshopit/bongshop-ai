import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bongshop.vn" },
    update: {},
    create: {
      email: "admin@bongshop.vn",
      name: "Admin BongShop",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      employee: {
        create: {
          employeeCode: "NV001",
          firstName: "Admin",
          lastName: "BongShop",
          email: "admin@bongshop.vn",
          phone: "0900000001",
          position: "Quản trị viên",
          department: "Ban giám đốc",
          hourlyRate: 0,
        },
      },
    },
  });

  // Seed manager user
  const managerPassword = await bcrypt.hash("manager123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@bongshop.vn" },
    update: {},
    create: {
      email: "manager@bongshop.vn",
      name: "Quản lý BongShop",
      passwordHash: managerPassword,
      role: Role.MANAGER,
      employee: {
        create: {
          employeeCode: "NV002",
          firstName: "Quản lý",
          lastName: "BongShop",
          email: "manager@bongshop.vn",
          phone: "0900000002",
          position: "Quản lý",
          department: "Quản lý",
          hourlyRate: 50000,
        },
      },
    },
  });

  // Seed default shifts
  await prisma.shift.createMany({
    data: [
      { name: "Ca sáng", startTime: "06:00", endTime: "14:00" },
      { name: "Ca chiều", startTime: "14:00", endTime: "22:00" },
      { name: "Ca tối", startTime: "22:00", endTime: "06:00" },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed:", { admin: admin.email, manager: manager.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
