// src/reportes/reportes.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, subDays, differenceInDays, format, startOfDay, endOfDay } from 'date-fns';

import { Venta } from '../venta/entities/venta.entity';
import { DetalleVenta } from '../venta/entities/detalleVenta.entity';
import { MovimientoInv } from '../movimiento_inv/entities/movimiento_inv.entity';
import { DetalleMov } from '../movimiento_inv/entities/detalle_mov_inv.entity';
import { ProductoVariedad } from '../producto/entities/productoVariedad.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Proveedor } from '../proveedor/entities/proveedor.entity';
import {ResumenVentasInterface,TopProductoInterface,RendimientoClienteInterface,TendenciaVentasInterface,StockBajoInterface,MovimientoInventarioInterface,RotacionInventarioInterface,ValorizacionInventarioInterface,PerformanceProveedorInterface,TiempoReposicionInterface
} from './interfaces/reportes.interfaces';

import { ReportFilterDto, TopProductosDto, StockBajoDto, RotacionInventarioDto } from './dto/report-filters.dto';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detalleVentaRepository: Repository<DetalleVenta>,
    @InjectRepository(MovimientoInv)
    private readonly movimientoRepository: Repository<MovimientoInv>,
    @InjectRepository(DetalleMov)
    private readonly detalleMovRepository: Repository<DetalleMov>,
    @InjectRepository(ProductoVariedad)
    private readonly productoVariedadRepository: Repository<ProductoVariedad>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async getResumenVentas(tenantId: string, filters: ReportFilterDto): Promise<ResumenVentasInterface> {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : subDays(new Date(), 30);
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();

    // Consulta principal
    const query = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      });

    const ventas = await query.getMany();

    const ventasTotales = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const cantidadTransacciones = ventas.length;
    const ticketPromedio = cantidadTransacciones > 0 ? ventasTotales / cantidadTransacciones : 0;
    const productosVendidos = ventas.reduce((sum, venta) => 
      sum + venta.detalles.reduce((detSum, det) => detSum + det.cantidad, 0), 0
    );
    const clientesUnicos = new Set(ventas.map(v => v.cliente.id)).size;

    // Comparación con período anterior
    const diasPeriodo = differenceInDays(fechaFin, fechaInicio);
    const fechaInicioAnterior = subDays(fechaInicio, diasPeriodo);
    const fechaFinAnterior = subDays(fechaFin, diasPeriodo);

    const ventasAnteriores = await this.ventaRepository.createQueryBuilder('venta')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicioAnterior),
        fechaFin: endOfDay(fechaFinAnterior)
      })
      .getMany();

    const ventasTotalesAnterior = ventasAnteriores.reduce((sum, venta) => sum + venta.total, 0);
    const transaccionesAnterior = ventasAnteriores.length;
    const ticketPromedioAnterior = transaccionesAnterior > 0 ? ventasTotalesAnterior / transaccionesAnterior : 0;

    return {
      periodo: {
        fechaInicio: format(fechaInicio, 'yyyy-MM-dd'),
        fechaFin: format(fechaFin, 'yyyy-MM-dd')
      },
      totales: {
        ventasTotales: Math.round(ventasTotales * 100) / 100,
        cantidadTransacciones,
        ticketPromedio: Math.round(ticketPromedio * 100) / 100,
        productosVendidos,
        clientesUnicos
      },
      comparacionPeriodoAnterior: {
        ventasTotales: {
          valor: ventasTotalesAnterior,
          porcentaje: this.calcularPorcentajeCambio(ventasTotales, ventasTotalesAnterior)
        },
        transacciones: {
          valor: transaccionesAnterior,
          porcentaje: this.calcularPorcentajeCambio(cantidadTransacciones, transaccionesAnterior)
        },
        ticketPromedio: {
          valor: ticketPromedioAnterior,
          porcentaje: this.calcularPorcentajeCambio(ticketPromedio, ticketPromedioAnterior)
        }
      }
    };
  }

  async getTopProductos(tenantId: string, params: TopProductosDto): Promise<TopProductoInterface[]> {
    const fechaInicio = params.fechaInicio ? new Date(params.fechaInicio) : subDays(new Date(), 30);
    const fechaFin = params.fechaFin ? new Date(params.fechaFin) : new Date();

    const query = this.detalleVentaRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.venta', 'venta')
      .leftJoinAndSelect('detalle.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.category', 'categoria')
      .where('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      });

    const detalles = await query.getMany();

    const productosMap = new Map<string, {
      variedad: any;
      cantidadTotal: number;
      ingresoTotal: number;
      precioPromedio: number;
      transacciones: number;
    }>();

    detalles.forEach(detalle => {
      const key = detalle.productoVariedadId;
      const ingreso = detalle.cantidad * detalle.precioUnitario;
      
      if (productosMap.has(key)) {
        const existing = productosMap.get(key)!;
        existing.cantidadTotal += detalle.cantidad;
        existing.ingresoTotal += ingreso;
        existing.transacciones += 1;
        existing.precioPromedio = existing.ingresoTotal / existing.cantidadTotal;
      } else {
        productosMap.set(key, {
          variedad: detalle.productoVariedad,
          cantidadTotal: detalle.cantidad,
          ingresoTotal: ingreso,
          precioPromedio: detalle.precioUnitario,
          transacciones: 1
        });
      }
    });

    const productos = Array.from(productosMap.entries()).map(([id, data]) => ({
      productoVariedadId: id,
      nombreProducto: data.variedad.producto.name,
      talla: data.variedad.size.name,
      color: data.variedad.color,
      categoria: data.variedad.producto.category.name,
      cantidadVendida: data.cantidadTotal,
      ingresosGenerados: Math.round(data.ingresoTotal * 100) / 100,
      precioPromedio: Math.round(data.precioPromedio * 100) / 100,
      posicion: 0
    }));

    if (params.tipo === 'cantidad') {
      productos.sort((a, b) => b.cantidadVendida - a.cantidadVendida);
    } else {
      productos.sort((a, b) => b.ingresosGenerados - a.ingresosGenerados);
    }

    return productos.slice(0, params.limit).map((producto, index) => ({
      ...producto,
      posicion: index + 1
    }));
  }

  async getRendimientoClientes(tenantId: string, filters: ReportFilterDto): Promise<RendimientoClienteInterface[]> {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : subDays(new Date(), 365);
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();

    const query = this.ventaRepository.createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('detalle.productoVariedad', 'variedad')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      })
      .orderBy('venta.fechaVenta', 'ASC');

    const ventas = await query.getMany();

    const clientesMap = new Map<string, {
      cliente: any;
      ventas: any[];
      totalCompras: number;
      fechas: Date[];
      productosUnicos: Set<string>;
    }>();

    ventas.forEach(venta => {
      const clienteId = venta.cliente.id;
      
      if (clientesMap.has(clienteId)) {
        const existing = clientesMap.get(clienteId)!;
        existing.ventas.push(venta);
        existing.totalCompras += venta.total;
        existing.fechas.push(venta.fechaVenta);
        venta.detalles.forEach(d => existing.productosUnicos.add(d.productoVariedadId));
      } else {
        const productosUnicos = new Set<string>();
        venta.detalles.forEach(d => productosUnicos.add(d.productoVariedadId));
        
        clientesMap.set(clienteId, {
          cliente: venta.cliente,
          ventas: [venta],
          totalCompras: venta.total,
          fechas: [venta.fechaVenta],
          productosUnicos
        });
      }
    });

    return Array.from(clientesMap.entries()).map(([clienteId, data]) => {
      const cantidadCompras = data.ventas.length;
      const valorPromedio = data.totalCompras / cantidadCompras;
      
      // Calcular frecuencia de compra (días promedio entre compras)
      let frecuenciaCompra = 0;
      if (data.fechas.length > 1) {
        const fechasOrdenadas = data.fechas.sort((a, b) => a.getTime() - b.getTime());
        let totalDias = 0;
        for (let i = 1; i < fechasOrdenadas.length; i++) {
          totalDias += differenceInDays(fechasOrdenadas[i], fechasOrdenadas[i - 1]);
        }
        frecuenciaCompra = totalDias / (fechasOrdenadas.length - 1);
      }

      let clasificacion: 'VIP' | 'Frecuente' | 'Ocasional' | 'Nuevo';
      if (data.totalCompras > 1000 && cantidadCompras > 5) {
        clasificacion = 'VIP';
      } else if (cantidadCompras > 3 && frecuenciaCompra < 30) {
        clasificacion = 'Frecuente';
      } else if (cantidadCompras > 1) {
        clasificacion = 'Ocasional';
      } else {
        clasificacion = 'Nuevo';
      }

      return {
        clienteId,
        nombreCliente: data.cliente.fullName,
        email: data.cliente.email,
        totalCompras: Math.round(data.totalCompras * 100) / 100,
        frecuenciaCompra: Math.round(frecuenciaCompra),
        valorPromedioPorCompra: Math.round(valorPromedio * 100) / 100,
        ultimaCompra: data.fechas[data.fechas.length - 1],
        clasificacion,
        productosUnicos: data.productosUnicos.size
      };
    }).sort((a, b) => b.totalCompras - a.totalCompras);
  }

  async getTendenciasVentas(tenantId: string, filters: ReportFilterDto): Promise<TendenciaVentasInterface[]> {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : subDays(new Date(), 30);
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();

    const ventas = await this.ventaRepository.createQueryBuilder('venta')
      .where('venta.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      })
      .orderBy('venta.fechaVenta', 'ASC')
      .getMany();

    // Agrupar por día
    const ventasPorDia = new Map<string, {
      ventas: number;
      transacciones: number;
      fecha: Date;
    }>();

    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = addDays(fecha, 1)) {
      const key = format(fecha, 'yyyy-MM-dd');
      ventasPorDia.set(key, {
        ventas: 0,
        transacciones: 0,
        fecha: new Date(fecha)
      });
    }

    ventas.forEach(venta => {
      const key = format(venta.fechaVenta, 'yyyy-MM-dd');
      const existing = ventasPorDia.get(key);
      if (existing) {
        existing.ventas += venta.total;
        existing.transacciones += 1;
      }
    });

    return Array.from(ventasPorDia.entries()).map(([fecha, data]) => ({
      fecha,
      ventasDiarias: Math.round(data.ventas * 100) / 100,
      transaccionesDiarias: data.transacciones,
      ticketPromedioDiario: data.transacciones > 0 ? 
        Math.round((data.ventas / data.transacciones) * 100) / 100 : 0,
      diaSemana: format(data.fecha, 'EEEE'),
      mes: format(data.fecha, 'MMMM'),
      año: data.fecha.getFullYear()
    }));
  }


  async getStockBajo(tenantId: string, params: StockBajoDto): Promise<StockBajoInterface[]> {
    const query = this.productoVariedadRepository.createQueryBuilder('variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.category', 'categoria')
      .where('variedad.tenantId = :tenantId', { tenantId })
      .andWhere('variedad.quantity <= :umbral', { umbral: params.umbral })
      .andWhere('producto.isActive = :isActive', { isActive: true });

    if (params.categoriaId) {
      query.andWhere('producto.category.id = :categoriaId', { categoriaId: params.categoriaId });
    }

    const productos = await query.getMany();

    const resultados: StockBajoInterface[] = [];

    for (const producto of productos) {
      // Buscar última venta
      const ultimaVenta = await this.detalleVentaRepository.createQueryBuilder('detalle')
        .leftJoinAndSelect('detalle.venta', 'venta')
        .where('detalle.productoVariedadId = :id', { id: producto.Id })
        .andWhere('detalle.tenantId = :tenantId', { tenantId })
        .andWhere('venta.estado = :estado', { estado: 'completada' })
        .orderBy('venta.fechaVenta', 'DESC')
        .getOne();

      // Buscar última compra
      const ultimaCompra = await this.detalleMovRepository.createQueryBuilder('detalle')
        .leftJoinAndSelect('detalle.movimientoInv', 'movimiento')
        .where('detalle.productoVariedadId = :id', { id: producto.Id })
        .andWhere('detalle.tenantId = :tenantId', { tenantId })
        .orderBy('movimiento.fechaRegistro', 'DESC')
        .getOne();

      const diasSinVenta = ultimaVenta?.venta?.fechaVenta ? 
        differenceInDays(new Date(), ultimaVenta.venta.fechaVenta) : 999;

      resultados.push({
        productoVariedadId: producto.Id,
        nombreProducto: producto.producto.name,
        talla: producto.size.name,
        color: producto.color,
        categoria: producto.producto.category.name,
        stockActual: producto.quantity,
        stockMinimo: params.umbral || 10,
        diasSinVenta,
        ultimaVenta: ultimaVenta?.venta?.fechaVenta,
        ultimaCompra: ultimaCompra?.movimientoInv?.fechaRegistro,
        proveedor: undefined 
      });
    }

    return resultados.sort((a, b) => a.stockActual - b.stockActual);
  }

  private calcularPorcentajeCambio(valorActual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
    return Math.round(((valorActual - valorAnterior) / valorAnterior) * 100 * 100) / 100;
  }

  async getMovimientosInventario(tenantId: string, filters: ReportFilterDto): Promise<MovimientoInventarioInterface[]> {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : subDays(new Date(), 30);
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();

    const entradas = await this.detalleMovRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.movimientoInv', 'movimiento')
      .leftJoinAndSelect('detalle.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.proveedor', 'proveedor')
      .where('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('movimiento.fechaRegistro BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      })
      .orderBy('movimiento.fechaRegistro', 'DESC')
      .getMany();

    const salidas = await this.detalleVentaRepository.createQueryBuilder('detalle')
      .leftJoinAndSelect('detalle.venta', 'venta')
      .leftJoinAndSelect('detalle.productoVariedad', 'variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('venta.usuario', 'usuario')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .where('detalle.tenantId = :tenantId', { tenantId })
      .andWhere('venta.estado = :estado', { estado: 'completada' })
      .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: startOfDay(fechaInicio),
        fechaFin: endOfDay(fechaFin)
      })
      .orderBy('venta.fechaVenta', 'DESC')
      .getMany();

    const movimientos: MovimientoInventarioInterface[] = [];

    entradas.forEach(detalle => {
      movimientos.push({
        fecha: detalle.movimientoInv.fechaRegistro,
        tipo: 'entrada',
        cantidad: detalle.cantidad,
        motivo: 'Compra a proveedor',
        usuario: detalle.movimientoInv.usuario?.fullName,
        proveedor: detalle.movimientoInv.proveedor?.nombre,
        producto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        precio: detalle.precio
      });
    });

    salidas.forEach(detalle => {
      movimientos.push({
        fecha: detalle.venta.fechaVenta,
        tipo: 'salida',
        cantidad: detalle.cantidad,
        motivo: 'Venta a cliente',
        usuario: detalle.venta.usuario?.fullName || 'Autoservicio',
        producto: detalle.productoVariedad.producto.name,
        talla: detalle.productoVariedad.size.name,
        color: detalle.productoVariedad.color,
        precio: detalle.precioUnitario
      });
    });

    return movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async getRotacionInventario(tenantId: string, params: RotacionInventarioDto): Promise<RotacionInventarioInterface[]> {
    const fechaInicio = params.fechaInicio ? new Date(params.fechaInicio) : subDays(new Date(), 365);
    const fechaFin = params.fechaFin ? new Date(params.fechaFin) : new Date();
    const diasPeriodo = differenceInDays(fechaFin, fechaInicio);

    // Obtener todas las variedades de productos activos
    const productos = await this.productoVariedadRepository.createQueryBuilder('variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.category', 'categoria')
      .where('variedad.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = :isActive', { isActive: true })
      .getMany();

    const rotaciones: RotacionInventarioInterface[] = [];

    for (const producto of productos) {
      const ventasResult = await this.detalleVentaRepository.createQueryBuilder('detalle')
        .leftJoinAndSelect('detalle.venta', 'venta')
        .select('SUM(detalle.cantidad)', 'totalVendido')
        .where('detalle.productoVariedadId = :id', { id: producto.Id })
        .andWhere('detalle.tenantId = :tenantId', { tenantId })
        .andWhere('venta.estado = :estado', { estado: 'completada' })
        .andWhere('venta.fechaVenta BETWEEN :fechaInicio AND :fechaFin', {
          fechaInicio: startOfDay(fechaInicio),
          fechaFin: endOfDay(fechaFin)
        })
        .getRawOne();

      const cantidadVendida = parseInt(ventasResult?.totalVendido) || 0;

      const stockPromedio = producto.quantity;
      const valorInventario = stockPromedio * producto.price;

      const rotacionAnual = stockPromedio > 0 ? 
        (cantidadVendida / stockPromedio) * (365 / diasPeriodo) : 0;

      // Días de inventario
      const diasInventario = rotacionAnual > 0 ? 365 / rotacionAnual : 999;

      let clasificacion: 'Rápida' | 'Media' | 'Lenta';
      if (rotacionAnual >= 12) { 
        clasificacion = 'Rápida';
      } else if (rotacionAnual >= 4) { 
        clasificacion = 'Media';
      } else {
        clasificacion = 'Lenta';
      }

      const rotacion: RotacionInventarioInterface = {
        productoVariedadId: producto.Id,
        nombreProducto: producto.producto.name,
        talla: producto.size.name,
        color: producto.color,
        categoria: producto.producto.category.name,
        stockPromedio,
        cantidadVendida,
        rotacion: Math.round(rotacionAnual * 100) / 100,
        diasInventario: Math.round(diasInventario),
        clasificacion,
        valorInventario: Math.round(valorInventario * 100) / 100
      };

      rotaciones.push(rotacion);
    }


    let rotacionesFiltradas = rotaciones;
    if (params.tipo && params.tipo !== 'todas') {
      const tipoMap: { [key: string]: 'Rápida' | 'Media' | 'Lenta' } = { 
        'rapida': 'Rápida', 
        'lenta': 'Lenta' 
      };
      
      const clasificacionBuscada = tipoMap[params.tipo];
      if (clasificacionBuscada) {
        rotacionesFiltradas = rotaciones.filter(r => r.clasificacion === clasificacionBuscada);
      }
    }

    
    return rotacionesFiltradas
      .sort((a, b) => b.rotacion - a.rotacion)
      .slice(0, params.limit);
  }

  async getValorizacionInventario(tenantId: string): Promise<ValorizacionInventarioInterface> {
   
    const productos = await this.productoVariedadRepository.createQueryBuilder('variedad')
      .leftJoinAndSelect('variedad.producto', 'producto')
      .leftJoinAndSelect('variedad.size', 'size')
      .leftJoinAndSelect('producto.category', 'categoria')
      .where('variedad.tenantId = :tenantId', { tenantId })
      .andWhere('producto.isActive = :isActive', { isActive: true })
      .getMany();

    const valorTotalInventario = productos.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const cantidadTotalProductos = productos.reduce((sum, p) => sum + p.quantity, 0);
    const cantidadVariedades = productos.length;
    const valorPromedioPorProducto = cantidadTotalProductos > 0 ? valorTotalInventario / cantidadTotalProductos : 0;

  
    const porCategoriaMap = new Map<string, { valor: number; cantidad: number }>();
    
    productos.forEach(producto => {
      const categoria = producto.producto.category.name;
      const valor = producto.quantity * producto.price;
      
      if (porCategoriaMap.has(categoria)) {
        const existing = porCategoriaMap.get(categoria)!;
        existing.valor += valor;
        existing.cantidad += producto.quantity;
      } else {
        porCategoriaMap.set(categoria, { valor, cantidad: producto.quantity });
      }
    });

    const porCategoria = Array.from(porCategoriaMap.entries()).map(([categoria, data]) => ({
      categoria,
      valor: Math.round(data.valor * 100) / 100,
      porcentajeDelTotal: valorTotalInventario > 0 ? 
        Math.round((data.valor / valorTotalInventario) * 100 * 100) / 100 : 0,
      cantidadProductos: data.cantidad
    })).sort((a, b) => b.valor - a.valor);

    const stockBajo = productos.filter(p => p.quantity <= 10).length;
    
    const fechaLimite = subDays(new Date(), 90);
    let sinMovimiento = 0;
    
    for (const producto of productos) {
      const ultimaVenta = await this.detalleVentaRepository.createQueryBuilder('detalle')
        .leftJoinAndSelect('detalle.venta', 'venta')
        .where('detalle.productoVariedadId = :id', { id: producto.Id })
        .andWhere('detalle.tenantId = :tenantId', { tenantId })
        .andWhere('venta.fechaVenta >= :fecha', { fecha: fechaLimite })
        .getOne();
      
      if (!ultimaVenta) {
        sinMovimiento++;
      }
    }

    const sobrestockeados = productos.filter(p => p.quantity > 100).length; 

    return {
      resumen: {
        valorTotalInventario: Math.round(valorTotalInventario * 100) / 100,
        cantidadTotalProductos,
        cantidadVariedades,
        valorPromedioPorProducto: Math.round(valorPromedioPorProducto * 100) / 100
      },
      porCategoria,
      alertas: {
        stockBajo,
        sinMovimiento,
        sobrestockeados
      }
    };
  }

  async getPerformanceProveedores(tenantId: string, filters: ReportFilterDto): Promise<PerformanceProveedorInterface[]> {
    const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio) : subDays(new Date(), 365);
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();
    const proveedores = await this.proveedorRepository.find({
      where: { tenantId, isActive: true }
    });

    const performances: PerformanceProveedorInterface[] = [];

    for (const proveedor of proveedores) {
  
      const movimientos = await this.movimientoRepository.createQueryBuilder('movimiento')
        .leftJoinAndSelect('movimiento.detalles', 'detalle')
        .leftJoinAndSelect('detalle.productoVariedad', 'variedad')
        .where('movimiento.tenantId = :tenantId', { tenantId })
        .andWhere('movimiento.proveedor.id = :proveedorId', { proveedorId: proveedor.id })
        .andWhere('movimiento.fechaRegistro BETWEEN :fechaInicio AND :fechaFin', {
          fechaInicio: startOfDay(fechaInicio),
          fechaFin: endOfDay(fechaFin)
        })
        .orderBy('movimiento.fechaRegistro', 'ASC')
        .getMany();

      if (movimientos.length === 0) continue;

      const totalCompras = movimientos.reduce((sum, mov) => sum + mov.montoTotal, 0);
      const cantidadOrdenes = movimientos.length;
      const costoPromedio = totalCompras / cantidadOrdenes;

     
      let frecuenciaCompra = 0;
      if (movimientos.length > 1) {
        const fechas = movimientos.map(m => m.fechaRegistro).sort((a, b) => a.getTime() - b.getTime());
        let totalDias = 0;
        for (let i = 1; i < fechas.length; i++) {
          totalDias += differenceInDays(fechas[i], fechas[i - 1]);
        }
        frecuenciaCompra = totalDias / (fechas.length - 1);
      }

      
      const productosUnicos = new Set<string>();
      movimientos.forEach(mov => {
        mov.detalles.forEach(det => productosUnicos.add(det.productoVariedadId));
      });

      const ultimaCompra = movimientos[movimientos.length - 1].fechaRegistro;

      // Calificación simplificada
      let calificacion: 'Excelente' | 'Bueno' | 'Regular' | 'Malo';
      if (totalCompras > 5000 && cantidadOrdenes > 5) {
        calificacion = 'Excelente';
      } else if (totalCompras > 2000 && cantidadOrdenes > 3) {
        calificacion = 'Bueno';
      } else if (cantidadOrdenes > 1) {
        calificacion = 'Regular';
      } else {
        calificacion = 'Malo';
      }

      performances.push({
        proveedorId: proveedor.id,
        nombreProveedor: proveedor.nombre,
        contacto: proveedor.email || proveedor.telefono || 'No disponible',
        totalCompras: Math.round(totalCompras * 100) / 100,
        frecuenciaCompra: Math.round(frecuenciaCompra),
        costoPromedio: Math.round(costoPromedio * 100) / 100,
        cantidadOrdenes,
        productosUnicos: productosUnicos.size,
        ultimaCompra,
        calificacion
      });
    }

    return performances.sort((a, b) => b.totalCompras - a.totalCompras);
  }


  async getTiempoReposicion(tenantId: string): Promise<TiempoReposicionInterface[]> {
    const proveedores = await this.proveedorRepository.find({
      where: { tenantId, isActive: true }
    });
  
    const tiempos: TiempoReposicionInterface[] = [];
  
    for (const proveedor of proveedores) {
      const movimientos = await this.movimientoRepository.createQueryBuilder('movimiento')
        .leftJoinAndSelect('movimiento.detalles', 'detalle')
        .where('movimiento.tenantId = :tenantId', { tenantId })
        .andWhere('movimiento.proveedor.id = :proveedorId', { proveedorId: proveedor.id })
        .orderBy('movimiento.fechaRegistro', 'ASC')
        .getMany();
  
      if (movimientos.length < 2) continue;
  
      const fechas = movimientos.map(m => m.fechaRegistro);
      let totalDias = 0;
    
      const entregas: Array<{
        fecha: Date;
        tiempoEntrega: number;
        productos: number;
      }> = [];
  
      for (let i = 1; i < fechas.length; i++) {
        const tiempoEntrega = differenceInDays(fechas[i], fechas[i - 1]);
        totalDias += tiempoEntrega;
        
        entregas.push({
          fecha: fechas[i],
          tiempoEntrega,
          productos: movimientos[i].detalles.length
        });
      }
  
      const tiempoPromedio = totalDias / (fechas.length - 1);
      const tiempos_array = entregas.map(e => e.tiempoEntrega);
      const desviacion = this.calcularDesviacionEstandar(tiempos_array);
      const coeficienteVariacion = tiempoPromedio > 0 ? desviacion / tiempoPromedio : 0;
  
      let consistencia: 'Muy Consistente' | 'Consistente' | 'Variable' | 'Inconsistente';
      if (coeficienteVariacion < 0.1) {
        consistencia = 'Muy Consistente';
      } else if (coeficienteVariacion < 0.3) {
        consistencia = 'Consistente';
      } else if (coeficienteVariacion < 0.5) {
        consistencia = 'Variable';
      } else {
        consistencia = 'Inconsistente';
      }
  
      tiempos.push({
        proveedorId: proveedor.id,
        nombreProveedor: proveedor.nombre,
        producto: 'Múltiples productos',
        tiempoPromedioEntrega: Math.round(tiempoPromedio),
        ordenesProcesadas: movimientos.length,
        entregas,
        consistencia
      });
    }
  
    return tiempos.sort((a, b) => a.tiempoPromedioEntrega - b.tiempoPromedioEntrega);
  }
 
  private calcularDesviacionEstandar(valores: number[]): number {
    if (valores.length <= 1) return 0;
    
    const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
    return Math.sqrt(varianza);
  }

}