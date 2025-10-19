import { productRepository } from '@e-commerce/database';
import { GraphQLError } from 'graphql';

export const productResolvers = {
  Query: {
    product: async (_: any, { id }: { id: string }) => {
      try {
        const product = await productRepository.findById(id);
        if (!product) {
          throw new GraphQLError(`Product with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return product;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw new GraphQLError('Failed to fetch product', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    products: async (_: any, args: any) => {
      try {
        const { filter, sort, pagination } = args;
        
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
        
        const { items, totalCount } = await productRepository.findMany(
          filter,
          sort,
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
        console.error('Error fetching products:', error);
        throw new GraphQLError('Failed to fetch products', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Mutation: {
    createProduct: async (_: any, { input }: { input: any }) => {
      try {
        const product = await productRepository.create(input);
        
        return {
          code: '200',
          success: true,
          message: 'Product created successfully',
          product,
        };
      } catch (error) {
        console.error('Error creating product:', error);
        throw new GraphQLError('Failed to create product', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    updateProduct: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const existingProduct = await productRepository.findById(id);
        
        if (!existingProduct) {
          throw new GraphQLError(`Product with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        const product = await productRepository.update(id, input);
        
        return {
          code: '200',
          success: true,
          message: 'Product updated successfully',
          product,
        };
      } catch (error) {
        console.error('Error updating product:', error);
        throw new GraphQLError('Failed to update product', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    deleteProduct: async (_: any, { id }: { id: string }) => {
      try {
        const existingProduct = await productRepository.findById(id);
        
        if (!existingProduct) {
          throw new GraphQLError(`Product with ID ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        await productRepository.delete(id);
        
        return {
          code: '200',
          success: true,
          message: 'Product deleted successfully',
          id,
        };
      } catch (error) {
        console.error('Error deleting product:', error);
        throw new GraphQLError('Failed to delete product', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  
  Product: {
    __resolveReference: async (reference: { id: string }) => {
      return productRepository.findById(reference.id);
    },
  },
};