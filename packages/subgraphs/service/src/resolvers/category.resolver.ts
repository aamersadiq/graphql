import { categoryRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';

export const categoryResolvers = {
  Query: {
    category: async (_: any, { id }: { id: string }) => {
      try {
        const category = await categoryRepository.findById(id);
        if (!category) {
          throw new GraphQLError(`Category with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return category;
      } catch (error) {
        console.error('Error fetching category:', error);
        throw new GraphQLError('Failed to fetch category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    categories: async (_: any, args: any) => {
      try {
        const { filter, pagination } = args;
        
        const paginationOptions = pagination
          ? {
              skip: pagination.first && pagination.after
                ? parseInt(Buffer.from(pagination.after, 'base64').toString('ascii'))
                : undefined,
              take: pagination.first || pagination.last,
              cursor: pagination.after
                ? { id: Buffer.from(pagination.after, 'base64').toString('ascii') }
                : pagination.before
                ? { id: Buffer.from(pagination.before, 'base64').toString('ascii') }
                : undefined,
            }
          : undefined;
        
        const { items, totalCount } = await categoryRepository.findMany(
          filter,
          paginationOptions,
        );
        
        const edges = items.map(item => ({
          node: item,
          cursor: Buffer.from(item.id).toString('base64'),
        }));
        
        const startCursor = edges.length > 0 ? edges[0].cursor : null;
        const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
        
        const hasNextPage = pagination?.first
          ? items.length === pagination.first
          : false;
        
        const hasPreviousPage = pagination?.last
          ? items.length === pagination.last
          : false;
        
        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw new GraphQLError('Failed to fetch categories', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    createCategory: async (_: any, { input }: { input: any }) => {
      try {
        const category = await categoryRepository.create(input);
        
        return {
          code: '200',
          success: true,
          message: 'Category created successfully',
          category,
        };
      } catch (error) {
        console.error('Error creating category:', error);
        throw new GraphQLError('Failed to create category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    updateCategory: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const existingCategory = await categoryRepository.findById(id);
        
        if (!existingCategory) {
          throw new GraphQLError(`Category with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const category = await categoryRepository.update(id, input);
        
        return {
          code: '200',
          success: true,
          message: 'Category updated successfully',
          category,
        };
      } catch (error) {
        console.error('Error updating category:', error);
        throw new GraphQLError('Failed to update category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    deleteCategory: async (_: any, { id }: { id: string }) => {
      try {
        const existingCategory = await categoryRepository.findById(id);
        
        if (!existingCategory) {
          throw new GraphQLError(`Category with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        await categoryRepository.delete(id);
        
        return {
          code: '200',
          success: true,
          message: 'Category deleted successfully',
          id,
        };
      } catch (error) {
        console.error('Error deleting category:', error);
        throw new GraphQLError('Failed to delete category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Category: {
    __resolveReference: async (reference: { id: string }) => {
      return categoryRepository.findById(reference.id);
    },
    
    products: async (parent: any, args: any) => {
      try {
        const { filter, sort, pagination } = args;
        const category = await categoryRepository.findWithProducts(parent.id, {
          search: filter?.search,
          minPrice: filter?.minPrice,
          maxPrice: filter?.maxPrice,
          isActive: filter?.isActive,
          skip: pagination?.first && pagination?.after
            ? parseInt(Buffer.from(pagination.after, 'base64').toString('ascii'))
            : undefined,
          take: pagination?.first || pagination?.last,
        });
        
        if (!category) {
          throw new GraphQLError(`Category with ID ${parent.id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const products = category.products;
        const totalCount = products.length;
        
        const edges = products.map(product => ({
          node: product,
          cursor: Buffer.from(product.id).toString('base64'),
        }));
        
        const startCursor = edges.length > 0 ? edges[0].cursor : null;
        const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
        
        const hasNextPage = pagination?.first
          ? products.length === pagination.first
          : false;
        
        const hasPreviousPage = pagination?.last
          ? products.length === pagination.last
          : false;
        
        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching category products:', error);
        throw new GraphQLError('Failed to fetch category products', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};