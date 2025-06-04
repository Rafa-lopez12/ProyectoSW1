export interface ProductFilterInterface {
    categoryId?: string;
    subcategory?: string;
    search?: string;
    active?: boolean;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    color?: string;
    orderBy?: 'price' | 'name' | 'createdAt';
    orderDirection?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }