import { prisma } from './index';

async function main() {
  console.log('Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role with full access',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Regular customer role',
    },
  });

  console.log('Created roles:', { adminRole, customerRole });

  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'MANAGE_USERS' },
      update: {},
      create: {
        name: 'MANAGE_USERS',
        description: 'Can manage users',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_PRODUCTS' },
      update: {},
      create: {
        name: 'MANAGE_PRODUCTS',
        description: 'Can manage products',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_ORDERS' },
      update: {},
      create: {
        name: 'MANAGE_ORDERS',
        description: 'Can manage orders',
      },
    }),
  ]);

  console.log('Created permissions:', permissions);

  // Assign permissions to admin role
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // password is "password"
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Created admin user:', adminUser);

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // password is "password"
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Created test user:', testUser);

  // Assign customer role to test user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: testUser.id,
        roleId: customerRole.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      roleId: customerRole.id,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        slug: 'clothing',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-and-garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        description: 'Home decor and garden supplies',
        slug: 'home-and-garden',
        isActive: true,
      },
    }),
  ]);

  console.log('Created categories:', categories);

  // Create subcategories
  const electronicsSubcategories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'smartphones' },
      update: {},
      create: {
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        slug: 'smartphones',
        parentId: categories[0].id,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'laptops' },
      update: {},
      create: {
        name: 'Laptops',
        description: 'Notebook computers',
        slug: 'laptops',
        parentId: categories[0].id,
        isActive: true,
      },
    }),
  ]);

  console.log('Created electronics subcategories:', electronicsSubcategories);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'iphone-13-pro' },
      update: {},
      create: {
        name: 'iPhone 13 Pro',
        description: 'Apple iPhone 13 Pro with A15 Bionic chip',
        slug: 'iphone-13-pro',
        sku: 'IPHONE13PRO',
        price: 999.99,
        categoryId: electronicsSubcategories[0].id,
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'macbook-pro-16' },
      update: {},
      create: {
        name: 'MacBook Pro 16"',
        description: 'Apple MacBook Pro 16" with M1 Pro chip',
        slug: 'macbook-pro-16',
        sku: 'MACBOOKPRO16',
        price: 2499.99,
        categoryId: electronicsSubcategories[1].id,
        isActive: true,
        isFeatured: true,
      },
    }),
  ]);

  console.log('Created products:', products);

  // Add product images
  await Promise.all([
    prisma.productImage.create({
      data: {
        productId: products[0].id,
        url: 'https://example.com/images/iphone-13-pro.jpg',
        altText: 'iPhone 13 Pro',
        isPrimary: true,
      },
    }),
    prisma.productImage.create({
      data: {
        productId: products[1].id,
        url: 'https://example.com/images/macbook-pro-16.jpg',
        altText: 'MacBook Pro 16"',
        isPrimary: true,
      },
    }),
  ]);

  // Add inventory
  await Promise.all([
    prisma.inventoryItem.create({
      data: {
        productId: products[0].id,
        quantity: 100,
        reservedQuantity: 0,
        restockThreshold: 10,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        productId: products[1].id,
        quantity: 50,
        reservedQuantity: 0,
        restockThreshold: 5,
      },
    }),
  ]);

  // Create promotion
  const promotion = await prisma.promotion.create({
    data: {
      name: 'Summer Sale',
      description: '20% off on all electronics',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });

  console.log('Created promotion:', promotion);

  // Apply promotion to electronics category
  await prisma.promotionCategory.create({
    data: {
      promotionId: promotion.id,
      categoryId: categories[0].id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });