export interface ClothingAnalysis {
    tipo: string;
    colores: string[];
    estilo: string;
    material: string;
    patron: string;
  }
  
  export interface SimilarProduct {
    id: string;
    name: string;
    description: string;
    images: string[];
    category: string;
    subcategory: string
    similarity: number;
    price: {
      min: number;
      max: number;
    };
    variants: number;
    matchReasons?: string[]
  }
  
  export interface SearchResult {
    success: boolean;
    analysis: ClothingAnalysis;
    results: SimilarProduct[];
  }