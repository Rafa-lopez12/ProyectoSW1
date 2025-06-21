// src/reportes/reportes.controller.ts
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { ReportFilterDto, TopProductosDto, StockBajoDto, RotacionInventarioDto } from './dto/report-filters.dto';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // =================== REPORTES DE VENTAS ===================

  @Get('ventas/resumen')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  async getResumenVentas(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    return this.reportesService.getResumenVentas(tenantId, filters);
  }

  @Get('ventas/top-productos')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  async getTopProductos(
    @GetTenantId() tenantId: string,
    @Query() params: TopProductosDto
  ) {
    return this.reportesService.getTopProductos(tenantId, params);
  }

  @Get('ventas/rendimiento-clientes')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  async getRendimientoClientes(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    return this.reportesService.getRendimientoClientes(tenantId, filters);
  }

  @Get('ventas/tendencias')
  @TenantFuncionalidadAuth('obtener-reportes-ventas')
  async getTendenciasVentas(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    return this.reportesService.getTendenciasVentas(tenantId, filters);
  }

  // =================== REPORTES DE INVENTARIO ===================

  @Get('inventario/stock-bajo')
  @TenantFuncionalidadAuth('obtener-reportes-inventario')
  async getStockBajo(
    @GetTenantId() tenantId: string,
    @Query() params: StockBajoDto
  ) {
    return this.reportesService.getStockBajo(tenantId, params);
  }

  @Get('inventario/movimientos')
  @TenantFuncionalidadAuth('obtener-reportes-inventario')
  async getMovimientosInventario(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    return this.reportesService.getMovimientosInventario(tenantId, filters);
  }

  @Get('inventario/rotacion')
  @TenantFuncionalidadAuth('obtener-reportes-inventario')
  async getRotacionInventario(
    @GetTenantId() tenantId: string,
    @Query() params: RotacionInventarioDto
  ) {
    return this.reportesService.getRotacionInventario(tenantId, params);
  }

  @Get('inventario/valorizacion')
  @TenantFuncionalidadAuth('obtener-reportes-inventario')
  async getValorizacionInventario(
    @GetTenantId() tenantId: string
  ) {
    return this.reportesService.getValorizacionInventario(tenantId);
  }

  // =================== REPORTES DE PROVEEDORES ===================

  @Get('proveedores/performance')
  @TenantFuncionalidadAuth('obtener-reportes-proveedores')
  async getPerformanceProveedores(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    return this.reportesService.getPerformanceProveedores(tenantId, filters);
  }



  @Get('proveedores/tiempo-reposicion')
  @TenantFuncionalidadAuth('obtener-reportes-proveedores')
  async getTiempoReposicion(
    @GetTenantId() tenantId: string
  ) {
    return this.reportesService.getTiempoReposicion(tenantId);
  }

  // =================== REPORTES CONSOLIDADOS ===================

  @Get('dashboard/resumen-ejecutivo')
  @TenantFuncionalidadAuth('obtener-dashboard-ejecutivo')
  async getResumenEjecutivo(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    // Combinar múltiples reportes para un dashboard ejecutivo
    const [
      resumenVentas,
      topProductos,
      stockBajo,
      valorizacionInventario
    ] = await Promise.all([
      this.reportesService.getResumenVentas(tenantId, filters),
      this.reportesService.getTopProductos(tenantId, { limit: 5, tipo: 'ingresos' }),
      this.reportesService.getStockBajo(tenantId, { umbral: 10 }),
      this.reportesService.getValorizacionInventario(tenantId)
    ]);

    return {
      ventas: resumenVentas,
      topProductos,
      alertas: {
        stockBajo: stockBajo.length,
        productos: stockBajo.slice(0, 5),
        valorInventario: valorizacionInventario.resumen.valorTotalInventario
      },
      inventario: valorizacionInventario
    };
  }

  @Get('dashboard/alertas')
  @TenantFuncionalidadAuth('obtener-alertas')
  async getAlertas(
    @GetTenantId() tenantId: string
  ) {
    const [stockBajo, valorizacion] = await Promise.all([
      this.reportesService.getStockBajo(tenantId, { umbral: 5 }),
      this.reportesService.getValorizacionInventario(tenantId)
    ]);

    return {
      stockCritico: stockBajo.filter(p => p.stockActual <= 3),
      stockBajo: stockBajo.filter(p => p.stockActual > 3 && p.stockActual <= 10),
      sinMovimiento: valorizacion.alertas.sinMovimiento,
      valorInventarioBajo: valorizacion.resumen.valorTotalInventario < 10000,
      resumen: {
        totalAlertas: stockBajo.length + valorizacion.alertas.sinMovimiento,
        criticidad: stockBajo.filter(p => p.stockActual <= 3).length > 0 ? 'Alta' : 
                   stockBajo.length > 5 ? 'Media' : 'Baja'
      }
    };
  }

  // =================== EXPORTACIÓN DE REPORTES ===================

  @Get('export/ventas-excel')
  @TenantFuncionalidadAuth('exportar-reportes')
  async exportarVentasExcel(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    // TODO: Implementar exportación a Excel
    // Puedes usar librerías como exceljs o xlsx
    return {
      message: 'Funcionalidad de exportación pendiente de implementación',
      datos: await this.reportesService.getResumenVentas(tenantId, filters)
    };
  }

  @Get('export/inventario-pdf')
  @TenantFuncionalidadAuth('exportar-reportes')
  async exportarInventarioPdf(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    // TODO: Implementar exportación a PDF
    // Puedes usar librerías como puppeteer o pdfkit
    return {
      message: 'Funcionalidad de exportación PDF pendiente de implementación',
      datos: await this.reportesService.getValorizacionInventario(tenantId)
    };
  }

  // =================== REPORTES PROGRAMADOS ===================

  @Get('scheduled/ventas-diarias')
  @TenantFuncionalidadAuth('obtener-reportes-programados')
  async getReporteDiario(
    @GetTenantId() tenantId: string
  ) {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const filters: ReportFilterDto = {
      fechaInicio: ayer.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    };

    const [resumenVentas, topProductos, alertas] = await Promise.all([
      this.reportesService.getResumenVentas(tenantId, filters),
      this.reportesService.getTopProductos(tenantId, { limit: 3, tipo: 'ingresos' }),
      this.reportesService.getStockBajo(tenantId, { umbral: 5 })
    ]);

    return {
      fecha: hoy.toISOString().split('T')[0],
      tipo: 'Reporte Diario',
      ventas: resumenVentas,
      productosDestacados: topProductos,
      alertasUrgentes: alertas.slice(0, 5),
      resumen: {
        ingresos: resumenVentas.totales.ventasTotales,
        transacciones: resumenVentas.totales.cantidadTransacciones,
        alertasCriticas: alertas.filter(a => a.stockActual <= 3).length
      }
    };
  }

  @Get('scheduled/inventario-semanal')
  @TenantFuncionalidadAuth('obtener-reportes-programados')
  async getReporteSemanal(
    @GetTenantId() tenantId: string
  ) {
    const hoy = new Date();
    const haceUnaSemana = new Date(hoy);
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

    const filters: ReportFilterDto = {
      fechaInicio: haceUnaSemana.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    };

    const [movimientos, rotacion, proveedores] = await Promise.all([
      this.reportesService.getMovimientosInventario(tenantId, filters),
      this.reportesService.getRotacionInventario(tenantId, { limit: 10 }),
      this.reportesService.getPerformanceProveedores(tenantId, filters)
    ]);

    return {
      semana: `${haceUnaSemana.toISOString().split('T')[0]} al ${hoy.toISOString().split('T')[0]}`,
      tipo: 'Reporte Semanal de Inventario',
      movimientos: {
        total: movimientos.length,
        entradas: movimientos.filter(m => m.tipo === 'entrada').length,
        salidas: movimientos.filter(m => m.tipo === 'salida').length,
        detalle: movimientos.slice(0, 10)
      },
      rotacion: {
        productosRapidos: rotacion.filter(r => r.clasificacion === 'Rápida').length,
        productosLentos: rotacion.filter(r => r.clasificacion === 'Lenta').length,
        detalleTop: rotacion.slice(0, 5)
      },
      proveedores: {
        activos: proveedores.length,
        topPerformance: proveedores.slice(0, 3)
      }
    };
  }

  // =================== ANÁLISIS AVANZADOS ===================

  @Get('analytics/tendencias-avanzadas')
  @TenantFuncionalidadAuth('obtener-analytics-avanzados')
  async getTendenciasAvanzadas(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    const tendencias = await this.reportesService.getTendenciasVentas(tenantId, filters);
    
    // Análisis de tendencias
    const ventasPorDia = tendencias.map(t => t.ventasDiarias);
    const promedio = ventasPorDia.reduce((sum, v) => sum + v, 0) / ventasPorDia.length;
    
    // Cálculo de tendencia (regresión lineal simple)
    const n = ventasPorDia.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    ventasPorDia.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercepto = (sumY - pendiente * sumX) / n;
    
    const tendenciaGeneralPorcentaje = ((pendiente * n) / promedio) * 100;
    
    return {
      periodo: `${filters.fechaInicio || 'Último mes'} al ${filters.fechaFin || 'Hoy'}`,
      tendencias,
      analisis: {
        ventaPromedioDiaria: Math.round(promedio * 100) / 100,
        tendenciaGeneral: pendiente > 0 ? 'Creciente' : pendiente < 0 ? 'Decreciente' : 'Estable',
        cambioPortucentaje: Math.round(tendenciaGeneralPorcentaje * 100) / 100,
        proyeccionProximaSemana: Math.round((intercepto + pendiente * (n + 7)) * 100) / 100,
        volatilidad: this.calcularVolatilidad(ventasPorDia),
        diasMasVentas: tendencias.filter(t => t.ventasDiarias > promedio * 1.2).length,
        diasMenosVentas: tendencias.filter(t => t.ventasDiarias < promedio * 0.8).length
      }
    };
  }

  @Get('analytics/segmentacion-clientes')
  @TenantFuncionalidadAuth('obtener-analytics-avanzados')
  async getSegmentacionClientes(
    @GetTenantId() tenantId: string,
    @Query() filters: ReportFilterDto
  ) {
    const clientes = await this.reportesService.getRendimientoClientes(tenantId, filters);
    
    // Segmentación RFM simplificada
    const segmentacion = {
      VIP: clientes.filter(c => c.clasificacion === 'VIP'),
      Frecuentes: clientes.filter(c => c.clasificacion === 'Frecuente'),
      Ocasionales: clientes.filter(c => c.clasificacion === 'Ocasional'),
      Nuevos: clientes.filter(c => c.clasificacion === 'Nuevo')
    };

    const totalClientes = clientes.length;
    const ventasTotales = clientes.reduce((sum, c) => sum + c.totalCompras, 0);

    return {
      totalClientes,
      ventasTotales: Math.round(ventasTotales * 100) / 100,
      segmentos: {
        VIP: {
          cantidad: segmentacion.VIP.length,
          porcentaje: Math.round((segmentacion.VIP.length / totalClientes) * 100),
          ventasTotales: segmentacion.VIP.reduce((sum, c) => sum + c.totalCompras, 0),
          contribucionPorcentaje: Math.round((segmentacion.VIP.reduce((sum, c) => sum + c.totalCompras, 0) / ventasTotales) * 100)
        },
        Frecuentes: {
          cantidad: segmentacion.Frecuentes.length,
          porcentaje: Math.round((segmentacion.Frecuentes.length / totalClientes) * 100),
          ventasTotales: segmentacion.Frecuentes.reduce((sum, c) => sum + c.totalCompras, 0),
          contribucionPorcentaje: Math.round((segmentacion.Frecuentes.reduce((sum, c) => sum + c.totalCompras, 0) / ventasTotales) * 100)
        },
        Ocasionales: {
          cantidad: segmentacion.Ocasionales.length,
          porcentaje: Math.round((segmentacion.Ocasionales.length / totalClientes) * 100),
          ventasTotales: segmentacion.Ocasionales.reduce((sum, c) => sum + c.totalCompras, 0),
          contribucionPorcentaje: Math.round((segmentacion.Ocasionales.reduce((sum, c) => sum + c.totalCompras, 0) / ventasTotales) * 100)
        },
        Nuevos: {
          cantidad: segmentacion.Nuevos.length,
          porcentaje: Math.round((segmentacion.Nuevos.length / totalClientes) * 100),
          ventasTotales: segmentacion.Nuevos.reduce((sum, c) => sum + c.totalCompras, 0),
          contribucionPorcentaje: Math.round((segmentacion.Nuevos.reduce((sum, c) => sum + c.totalCompras, 0) / ventasTotales) * 100)
        }
      },
      recomendaciones: this.generarRecomendacionesClientes(segmentacion, totalClientes)
    };
  }

  // =================== MÉTODOS HELPER ===================

  private calcularVolatilidad(valores: number[]): string {
    if (valores.length <= 1) return 'No calculable';
    
    const promedio = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    const varianza = valores.reduce((sum, v) => sum + Math.pow(v - promedio, 2), 0) / valores.length;
    const desviacion = Math.sqrt(varianza);
    const coeficienteVariacion = promedio > 0 ? desviacion / promedio : 0;

    if (coeficienteVariacion < 0.1) return 'Muy Baja';
    if (coeficienteVariacion < 0.2) return 'Baja';
    if (coeficienteVariacion < 0.4) return 'Media';
    if (coeficienteVariacion < 0.6) return 'Alta';
    return 'Muy Alta';
  }

  private generarRecomendacionesClientes(segmentacion: any, totalClientes: number): string[] {
    const recomendaciones: string[] = [];
    
    const porcentajeVIP = (segmentacion.VIP.length / totalClientes) * 100;
    const porcentajeNuevos = (segmentacion.Nuevos.length / totalClientes) * 100;
    const porcentajeFrecuentes = (segmentacion.Frecuentes.length / totalClientes) * 100;

    if (porcentajeVIP < 5) {
      recomendaciones.push('Implementar programa de fidelización para convertir clientes frecuentes en VIP');
    }

    if (porcentajeNuevos > 50) {
      recomendaciones.push('Alto porcentaje de clientes nuevos: enfocar en retención y seguimiento post-venta');
    }

    if (porcentajeFrecuentes > 40) {
      recomendaciones.push('Excelente base de clientes frecuentes: oportunidad para upselling y cross-selling');
    }

    if (segmentacion.Ocasionales.length > segmentacion.Frecuentes.length) {
      recomendaciones.push('Implementar campañas de reactivación para convertir clientes ocasionales en frecuentes');
    }

    return recomendaciones;
  }
}
