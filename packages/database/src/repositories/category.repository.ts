import { PrismaClient, Prisma, Category } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface CategoryCreateInput extends Omit<Prisma.CategoryCreateInput, 'parent' | 'children' | 'products' | 'image'> {
  parentId?: string;
  imageInput?: Prisma.ProductImageCreateInput;
}

export interface CategoryUpdateInput extends Omit<Prisma.CategoryUpdateInput, 'parent' | 'children' | 'products' | 'image'> {
  parentId?: string;
  imageInput?: Prisma.ProductImageCreateInput;
}

export interface CategoryFilterOptions {
  search?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface CategoryPaginationOptions {
  skip?: number;
  take?: number;
  cursor?: { id: string };
}

export class CategoryRepository extends PrismaRepository<Category, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.category);
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        image: true,
        seo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findMany(
    filter?: CategoryFilterOptions,
    pagination?: CategoryPaginationOptions,
  ) {
    const where: Prisma.CategoryWhereInput = {};
    
    if (filter) {
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      
      if (filter.parentId) {
        where.parentId = filter.parentId;
      } else if (filter.parentId === null) {
        where.parentId = null;
      }
      
      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }
    }
    
    const [items, totalCount] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination?.skip,
        take: pagination?.take,
        cursor: pagination?.cursor,
        include: {
          parent: true,
          children: true,
          image: true,
          seo: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);
    
    return { items, totalCount };
  }

  async findWithProducts(
    id: string,
    productFilter?: {
      skip?: number;
      take?: number;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      isActive?: boolean;
    },
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        image: true,
        seo: true,
        products: {
          where: {
            ...(productFilter?.search
              ? {
                  OR: [
                    { name: { contains: productFilter.search, mode: 'insensitive' } },
                    { description: { contains: productFilter.search, mode: 'insensitive' } },
                  ],
                }
              : {}),
            ...(productFilter?.minPrice !== undefined || productFilter?.maxPrice !== undefined
              ? {
                  price: {
                    ...(productFilter?.minPrice !== undefined ? { gte: productFilter.minPrice } : {}),
                    ...(productFilter?.maxPrice !== undefined ? { lte: productFilter.maxPrice } : {}),
                  },
                }
              : {}),
            ...(productFilter?.isActive !== undefined ? { isActive: productFilter.isActive } : {}),
          },
          skip: productFilter?.skip,
          take: productFilter?.take,
          include: {
            images: true,
            thumbnail: true,
            inventory: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return null;
    }

    return category;
  }

  async create(data: CategoryCreateInput): Promise<Category> {
    const { parentId, imageInput, ...categoryData } = data;
    
    return this.prisma.category.create({
      data: {
        ...categoryData,
        parent: parentId
          ? {
              connect: { id: parentId },
            }
          : undefined,
        image: imageInput
          ? {
              create: imageInput,
            }
          : undefined,
      },
      include: {
        parent: true,
        children: true,
        image: true,
        seo: true,
      },
    });
  }

  async update(id: string, data: CategoryUpdateInput): Promise<Category> {
    const { parentId, imageInput, ...categoryData } = data;
    
    return this.prisma.category.update({
      where: { id },
      data: {
        ...categoryData,
        parent: parentId !== undefined
          ? parentId
            ? { connect: { id: parentId } }
            : { disconnect: true }
          : undefined,
        image: imageInput
          ? {
              upsert: {
                create: imageInput,
                update: imageInput,
              },
            }
          : undefined,
      },
      include: {
        parent: true,
        children: true,
        image: true,
        seo: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.category.delete({
      where: { id },
    });
    return true;
  }
}