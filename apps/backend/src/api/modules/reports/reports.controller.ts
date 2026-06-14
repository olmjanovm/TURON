import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { sendDocumentToAdminUser } from '../../../services/telegram-bot.service.js';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', getStats);
  fastify.get('/export', exportExcel);
  // Mini App'da blob download ishlamaydi — hisobotni admin Telegram chatiga yuboramiz
  fastify.post('/export-telegram', exportExcelToTelegram);
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

/** Hisobot xlsx buffer'ini quradi (export va Telegram yuborish — ikkalasi ishlatadi). */
async function buildReportBuffer(range: { start: Date; end: Date }): Promise<Buffer> {
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

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function exportExcel(request: FastifyRequest, reply: FastifyReply) {
  const { timeframe, startDate, endDate } = reportQuerySchema.parse(request.query);
  const range = getDates(timeframe, startDate, endDate);
  const buffer = await buildReportBuffer(range);

  reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', `attachment; filename=turon_report_${timeframe}.xlsx`)
    .send(buffer);
}

/**
 * Hisobotni admin'ning Telegram chatiga DOCUMENT sifatida yuboradi.
 * Mini App WebView blob download'ni qo'llab-quvvatlamaydi — bu native yuklab olish beradi.
 */
async function exportExcelToTelegram(request: FastifyRequest, reply: FastifyReply) {
  const { timeframe, startDate, endDate } = reportQuerySchema.parse(request.query);
  const range = getDates(timeframe, startDate, endDate);
  const buffer = await buildReportBuffer(range);

  const user = request.user as { id?: string } | undefined;
  if (!user?.id) {
    return reply.code(401).send({ message: 'Avtorizatsiya talab qilinadi' });
  }

  const labels: Record<string, string> = {
    today: 'Bugun', week: 'Hafta', month: 'Oy', year: 'Yil', custom: 'Tanlangan davr',
  };
  const result = await sendDocumentToAdminUser(
    user.id,
    buffer,
    `turon_report_${timeframe}.xlsx`,
    `📊 Turon hisobot — ${labels[timeframe] ?? timeframe}`,
  );

  if (!result.ok) {
    return reply.code(502).send({
      message:
        result.reason === 'no_telegram_id'
          ? 'Telegram hisobingiz topilmadi'
          : "Telegram'ga yuborib bo'lmadi",
    });
  }

  return reply.send({ ok: true });
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
