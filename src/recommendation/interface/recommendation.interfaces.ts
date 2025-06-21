export interface ProductRecommendation {
    id: string;
    name: string;
    description: string;
    images: string[];
    category: string;
    subcategory: string;
    price: {
      min: number;
      max: number;
    };
    score: number; // 0-1, qué tan relevante es la recomendación
    reason: string; // Explicación de por qué se recomienda
    confidence: number; // 0-1, qué tan confiable es la recomendación
    tags: string[]; // etiquetas como "bestseller", "trending", "similar", etc.
  }
  
  export interface RecommendationContext {
    clienteId?: string;
    categoryId?: string;
    subcategory?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    excludeProductIds?: string[];
    includeOutOfStock?: boolean;
  }
  
  export interface RecommendationAnalysis {
    totalProducts: number;
    categoriesAnalyzed: number;
    salesDataPoints: number;
    analysisDate: Date;
    recommendations: ProductRecommendation[];
    insights: {
      trendingCategories: string[];
      popularPriceRange: { min: number; max: number };
      topColors: string[];
      topSizes: string[];
    };
  }
  
  export interface ClienteBehaviorInsight {
    clienteId: string;
    preferredCategories: string[];
    averageOrderValue: number;
    frequentSizes: string[];
    frequentColors: string[];
    lastPurchaseDate: Date;
    purchaseFrequency: 'low' | 'medium' | 'high';
    pricePreference: 'budget' | 'mid-range' | 'premium';
  }
