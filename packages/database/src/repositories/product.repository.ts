import { PrismaClient, Prisma, Product } from '@prisma/client';
import { PrismaRepository } from './prisma.repository';

export interface ProductCreateInput extends Omit<Prisma.ProductCreateInput, 'categories' | 'variants' | 'images'> {
  categoryIds?: string[];
  variants?: Prisma.ProductVariantCreateInput[];
  images?: Prisma.ProductImageCreateInput[];
  thumbnailId?: string;
}

export interface ProductUpdateInput extends Omit<Prisma.ProductUpdateInput, 'categories' | 'variants' | 'images'> {
  categoryIds?: string[];
  variants?: {
    create?: Prisma.ProductVariantCreateInput[];
    update?: Array<{ id: string } & Prisma.ProductVariantUpdateInput>;
    delete?: string[];
  };
  images?: {
    create?: Prisma.ProductImageCreateInput[];
    delete?: string[];
  };
  thumbnailId?: string;
}

export interface ProductFilterOptions {
  search?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  inventoryStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER';
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ProductPaginationOptions {
  skip?: number;
  take?: number;
  cursor?: { id: string };
}

export class ProductRepository extends PrismaRepository<Product, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        variants: {
          include: {
            attributes: true,
            images: true,
          },
        },
        attributes: true,
        images: true,
        thumbnail: true,
        seo: true,
        inventory: true,
      },
    });
  }

  async findMany(
    filter?: ProductFilterOptions,
    sort?: ProductSortOptions,
    pagination?: ProductPaginationOptions,
  ) {
    const where: Prisma.ProductWhereInput = {};
    
    if (filter) {
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      
      if (filter.categoryIds && filter.categoryIds.length > 0) {
        where.categories = {
          some: {
            id: { in: filter.categoryIds },
          },
        };
      }
      
      if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
        where.price = {};
        
        if (filter.minPrice !== undefined) {
          where.price.gte = filter.minPrice;
        }
        
        if (filter.maxPrice !== undefined) {
          where.price.lte = filter.maxPrice;
        }
      }
      
      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }
      
      if (filter.inventoryStatus) {
        where.inventory = {
          status: filter.inventoryStatus,
        };
      }
    }
    
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    
    if (sort) {
      switch (sort.field) {
        case 'name':
          orderBy.name = sort.direction;
          break;
        case 'price':
          orderBy.price = sort.direction;
          break;
        case 'createdAt':
          orderBy.createdAt = sort.direction;
          break;
        case 'updatedAt':
          orderBy.updatedAt = sort.direction;
          break;
      }
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const [items, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: pagination?.skip,
        take: pagination?.take,
        cursor: pagination?.cursor,
        include: {
          categories: true,
          variants: {
            include: {
              attributes: true,
              images: true,
            },
          },
          attributes: true,
          images: true,
          thumbnail: true,
          seo: true,
          inventory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    
    return { items, totalCount };
  }

  async create(data: ProductCreateInput): Promise<Product> {
    const { categoryIds, variants, images, thumbnailId, ...productData } = data;
    
    return this.prisma.product.create({
      data: {
        ...productData,
        categories: categoryIds && categoryIds.length > 0
          ? {
              connect: categoryIds.map(id => ({ id })),
            }
          : undefined,
        variants: variants && variants.length > 0
          ? {
              create: variants,
            }
          : undefined,
        images: images && images.length > 0
          ? {
              create: images,
            }
          : undefined,
        thumbnail: thumbnailId
          ? {
              connect: { id: thumbnailId },
            }
          : undefined,
      },
      include: {
        categories: true,
        variants: {
          include: {
            attributes: true,
            images: true,
          },
        },
        attributes: true,
        images: true,
        thumbnail: true,
        seo: true,
        inventory: true,
      },
    });
  }

  async update(id: string, data: ProductUpdateInput): Promise<Product> {
    const { categoryIds, variants, images, thumbnailId, ...productData } = data;
    
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        categories: categoryIds
          ? {
              set: [],
              connect: categoryIds.map(id => ({ id })),
            }
          : undefined,
        variants: variants
          ? {
              create: variants.create,
              update: variants.update?.map(({ id, ...data }) => ({
                where: { id },
                data,
              })),
              delete: variants.delete?.map(id => ({ id })),
            }
          : undefined,
        images: images
          ? {
              create: images.create,
              delete: images.delete?.map(id => ({ id })),
            }
          : undefined,
        thumbnail: thumbnailId
          ? {
              connect: { id: thumbnailId },
            }
          : undefined,
      },
      include: {
        categories: true,
        variants: {
          include: {
            attributes: true,
            images: true,
          },
        },
        attributes: true,
        images: true,
        thumbnail: true,
        seo: true,
        inventory: true,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.product.delete({
      where: { id },
    });
    return true;
  }
}