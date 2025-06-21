// src/reportes/interfaces/reportes.interfaces.ts

export interface ResumenVentasInterface {
    periodo: {
      fechaInicio: string;
      fechaFin: string;
    };
    totales: {
      ventasTotales: number;
      cantidadTransacciones: number;
      ticketPromedio: number;
      productosVendidos: number;
      clientesUnicos: number;
    };
    comparacionPeriodoAnterior?: {
      ventasTotales: {
        valor: number;
        porcentaje: number;
      };
      transacciones: {
        valor: number;
        porcentaje: number;
      };
      ticketPromedio: {
        valor: number;
        porcentaje: number;
      };
    };
  }
  
  export interface TopProductoInterface {
    productoVariedadId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    categoria: string;
    cantidadVendida: number;
    ingresosGenerados: number;
    precioPromedio: number;
    margenPromedio?: number;
    posicion: number;
  }
  
  export interface RendimientoClienteInterface {
    clienteId: string;
    nombreCliente: string;
    email: string;
    totalCompras: number;
    frecuenciaCompra: number; // días promedio entre compras
    valorPromedioPorCompra: number;
    ultimaCompra: Date;
    clasificacion: 'VIP' | 'Frecuente' | 'Ocasional' | 'Nuevo';
    productosUnicos: number;
  }
  
  export interface TendenciaVentasInterface {
    fecha: string;
    ventasDiarias: number;
    transaccionesDiarias: number;
    ticketPromedioDiario: number;
    diaSemana?: string;
    mes?: string;
    año?: number;
  }
  
  export interface StockBajoInterface {
    productoVariedadId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    categoria: string;
    stockActual: number;
    stockMinimo: number;
    diasSinVenta: number;
    ultimaVenta?: Date;
    ultimaCompra?: Date;
    proveedor?: string;
  }
  
  export interface MovimientoInventarioInterface {
    fecha: Date;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    motivo: string;
    usuario?: string;
    proveedor?: string;
    producto: string;
    talla: string;
    color: string;
    precio?: number;
  }
  
  export interface RotacionInventarioInterface {
    productoVariedadId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    categoria: string;
    stockPromedio: number;
    cantidadVendida: number;
    rotacion: number; // veces que rota al año
    diasInventario: number; // días promedio en stock
    clasificacion: 'Rápida' | 'Media' | 'Lenta';
    valorInventario: number;
  }
  
  export interface ValorizacionInventarioInterface {
    resumen: {
      valorTotalInventario: number;
      cantidadTotalProductos: number;
      cantidadVariedades: number;
      valorPromedioPorProducto: number;
    };
    porCategoria: {
      categoria: string;
      valor: number;
      porcentajeDelTotal: number;
      cantidadProductos: number;
    }[];
    alertas: {
      stockBajo: number;
      sinMovimiento: number;
      sobrestockeados: number;
    };
  }
  
  export interface PerformanceProveedorInterface {
    proveedorId: string;
    nombreProveedor: string;
    contacto: string;
    totalCompras: number;
    frecuenciaCompra: number; // días promedio entre compras
    costoPromedio: number;
    cantidadOrdenes: number;
    productosUnicos: number;
    ultimaCompra: Date;
    tiempoPromedioEntrega?: number;
    calificacion: 'Excelente' | 'Bueno' | 'Regular' | 'Malo';
  }
  
  export interface ComparativoPreciosInterface {
    producto: string;
    talla: string;
    color: string;
    proveedores: {
      proveedorId: string;
      nombreProveedor: string;
      precio: number;
      ultimaCompra: Date;
      cantidadComprada: number;
    }[];
    precioPromedio: number;
    mejorPrecio: number;
    peorPrecio: number;
    ahorroMaximo: number;
  }
  
  export interface TiempoReposicionInterface {
    proveedorId: string;
    nombreProveedor: string;
    producto: string;
    tiempoPromedioEntrega: number; // en días
    ordenesProcesadas: number;
    entregas: {
      fecha: Date;
      tiempoEntrega: number;
      productos: number;
    }[];
    consistencia: 'Muy Consistente' | 'Consistente' | 'Variable' | 'Inconsistente';
  }