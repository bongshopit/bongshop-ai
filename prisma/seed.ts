import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user (mặc định: admin@bongshop.vn / bongshop)
  const adminPassword = await bcrypt.hash("bongshop", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bongshop.vn" },
    update: { passwordHash: adminPassword },
    create: {
      email: "admin@bongshop.vn",
      name: "Admin BongShop",
      passwordHash: adminPassword,
      role: Role.ADMIN,
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

  // Seed default loyalty settings (US-013)
  const loyaltyDefaults = [
    { loyaltyCategory: "DEFAULT", rateType: "AMOUNT", amountPerPoint: 10000, pointsPerProduct: 1 },
    { loyaltyCategory: "SUA", rateType: "PRODUCT", amountPerPoint: 10000, pointsPerProduct: 1 },
    { loyaltyCategory: "TA_BIM", rateType: "PRODUCT", amountPerPoint: 10000, pointsPerProduct: 1 },
  ];
  for (const setting of loyaltyDefaults) {
    await prisma.loyaltySetting.upsert({
      where: { loyaltyCategory: setting.loyaltyCategory },
      update: {},
      create: setting,
    });
  }

  console.log("Seed completed:", { admin: admin.email });
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
