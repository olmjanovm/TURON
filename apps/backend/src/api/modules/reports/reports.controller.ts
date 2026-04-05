import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import * as XLSX from 'xlsx';
import { z } from 'zod';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', getStats);
  fastify.get('/export', exportExcel);
}

const reportQuerySchema = z.object({
  timeframe: z.enum(['today', 'week', 'month', 'year', 'custom']).default('today'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

async function getStats(request: FastifyRequest, reply: FastifyReply) {
  const { timeframe, startDate, endDate } = reportQuerySchema.parse(request.query);
  
  const range = getDates(timeframe, startDate, endDate);
  
  const [orders, revenue, customers] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.start, lte: range.end } },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { 
        status: 'DELIVERED',
        createdAt: { gte: range.start, lte: range.end } 
      },
      _sum: { totalAmount: true, discountAmount: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: range.start, lte: range.end } },
    }),
  ]);

  return {
    timeframe,
    range,
    orders: orders.map(o => ({ status: o.status, count: o._count })),
    revenue: {
      total: Number(revenue._sum.totalAmount || 0),
      discount: Number(revenue._sum.discountAmount || 0),
    },
    newCustomers: customers,
  };
}

async function exportExcel(request: FastifyRequest, reply: FastifyReply) {
  const { timeframe, startDate, endDate } = reportQuerySchema.parse(request.query);
  const range = getDates(timeframe, startDate, endDate);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.start, lte: range.end } },
    include: {
      user: true,
      items: true,
      courier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = orders.map((o) => ({
    'Buyurtma #': Number(o.orderNumber),
    'Sana': o.createdAt.toLocaleDateString(),
    'Mijoz': o.user.fullName,
    'Telefon': o.user.phoneNumber || 'N/A',
    'Holati': o.status,
    'Summa': Number(o.totalAmount),
    'Chegirma': Number(o.discountAmount),
    'To\'lov usuli': o.paymentMethod,
    'Kuryer': o.courier?.fullName || 'Belgilanmagan',
    'Mahsulotlar soni': o.items.length,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Xisobot');
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', `attachment; filename=turon_report_${timeframe}.xlsx`)
    .send(buffer);
}

function getDates(timeframe: string, startStr?: string, endStr?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (timeframe) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      if (startStr) start = new Date(startStr);
      if (endStr) end = new Date(endStr);
      break;
  }

  return { start, end };
}
