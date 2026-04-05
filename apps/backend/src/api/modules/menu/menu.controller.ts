import { FastifyReply, FastifyRequest } from 'fastify';
import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';
import { menuCache } from '../../../lib/cache.js';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickLocalizedText(record: any, fields: string[]) {
  for (const field of fields) {
    if (record?.[field]) {
      return record[field];
    }
  }

  return '';
}

function getAvailability(item: { isActive: boolean; stockQuantity: number | null; availabilityStatus?: string }) {
  if (item.availabilityStatus) {
    return item.availabilityStatus;
  }

  if (!item.isActive) {
    return ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE;
  }

  return (item.stockQuantity ?? 0) > 0
    ? ProductAvailabilityEnum.AVAILABLE
    : ProductAvailabilityEnum.OUT_OF_STOCK;
}

function normalizeAvailability(input: {
  isActive: boolean;
  stockQuantity: number;
  availability?: string;
}) {
  if (input.availability) {
    return input.availability;
  }

  if (!input.isActive) {
    return ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE;
  }

  return input.stockQuantity > 0
    ? ProductAvailabilityEnum.AVAILABLE
    : ProductAvailabilityEnum.OUT_OF_STOCK;
}

function serializeCategory(category: any) {
  const name = pickLocalizedText(category, ['nameUz', 'nameRu']) || 'Kategoriya';
  const imageUrl =
    category.iconUrl ||
    category.items?.find((item: any) => item.imageUrl)?.imageUrl ||
    '';

  return {
    id: category.id,
    name,
    slug: category.slug || slugify(name),
    imageUrl,
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function serializeProduct(product: any) {
  const isDiscounted = Boolean(product.isDiscounted || product.oldPrice || product.discountPercent);
  let badge = ProductBadgeEnum.NONE;

  if (isDiscounted) {
    badge = ProductBadgeEnum.DISCOUNT;
  } else if (product.isPopular) {
    badge = ProductBadgeEnum.POPULAR;
  } else if (product.isNew) {
    badge = ProductBadgeEnum.NEW;
  }

  return {
    id: product.id,
    categoryId: product.categoryId,
    name: pickLocalizedText(product, ['nameUz', 'nameRu']) || 'Taom',
    description: pickLocalizedText(product, ['descriptionUz', 'descriptionRu']),
    price: Number(product.price),
    oldPrice: product.oldPrice !== null && product.oldPrice !== undefined ? Number(product.oldPrice) : null,
    imageUrl: product.imageUrl || '',
    isActive: product.isActive,
    availability: getAvailability(product),
    stockQuantity: product.stockQuantity ?? 0,
    badge,
    badgeText: product.badgeText || null,
    weight: product.weightText || '',
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    isPopular: Boolean(product.isPopular),
    isDiscounted,
    discountPercent: product.discountPercent ?? null,
    sortOrder: product.sortOrder ?? 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function getSerializedCategoryById(id: string) {
  const category = await prisma.menuCategory.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return category ? serializeCategory(category) : null;
}

async function getSerializedProductById(id: string) {
  const product = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });

  return product ? serializeProduct(product) : null;
}

export async function getCategories(request: FastifyRequest, reply: FastifyReply) {
  const cacheKey = 'categories:active';
  const cached = menuCache.get<any[]>(cacheKey);
  if (cached) return reply.send(cached);

  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    include: {
      items: {
        where: { isActive: true, availabilityStatus: ProductAvailabilityEnum.AVAILABLE as any },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const serialized = categories.map(serializeCategory);
  menuCache.set(cacheKey, serialized);
  return reply.send(serialized);
}

export async function getAdminCategories(request: FastifyRequest, reply: FastifyReply) {
  const categories = await prisma.menuCategory.findMany({
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return reply.send(categories.map(serializeCategory));
}

export async function getProducts(request: FastifyRequest, reply: FastifyReply) {
  const cacheKey = 'products:active';
  const cached = menuCache.get<any[]>(cacheKey);
  if (cached) return reply.send(cached);

  const products = await prisma.menuItem.findMany({
    where: {
      isActive: true,
      availabilityStatus: ProductAvailabilityEnum.AVAILABLE as any,
      category: {
        isActive: true,
      },
    },
    include: { category: true },
    orderBy: [{ createdAt: 'desc' }],
  });

  const serialized = products.map(serializeProduct);
  menuCache.set(cacheKey, serialized);
  return reply.send(serialized);
}

export async function getAdminProducts(request: FastifyRequest, reply: FastifyReply) {
  const products = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ createdAt: 'desc' }],
  });

  return reply.send(products.map(serializeProduct));
}

export async function getProductById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const product = await prisma.menuItem.findFirst({
    where: {
      id: request.params.id,
      isActive: true,
      availabilityStatus: ProductAvailabilityEnum.AVAILABLE as any,
      category: {
        isActive: true,
      },
    },
    include: { category: true },
  });

  if (!product) {
    return reply.status(404).send({ error: 'Maxsulot topilmadi' });
  }

  return reply.send(serializeProduct(product));
}

export async function handleCreateCategory(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const data = request.body as any;
  const slug = slugify(data.name);

  const category = await prisma.menuCategory.create({
    data: {
      nameUz: data.name,
      nameRu: data.name,
      slug,
      iconUrl: data.iconUrl || null,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive ?? true,
    },
    include: {
      items: true,
    },
  });

  // Invalidate cache
  menuCache.clear();

  const serializedCategory = serializeCategory(category);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'CREATE_CATEGORY',
    entity: 'MenuCategory',
    entityId: category.id,
    newValue: serializedCategory,
  });

  return reply.status(201).send(serializedCategory);
}

export async function handleUpdateCategory(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const data = request.body as any;

  const existingCategory = await prisma.menuCategory.findUnique({
    where: { id: request.params.id },
    include: {
      items: true,
    },
  });

  if (!existingCategory) {
    return reply.status(404).send({ error: 'Kategoriya topilmadi' });
  }

  const oldValue = serializeCategory(existingCategory);

  await prisma.menuCategory.update({
    where: { id: request.params.id },
    data: {
      nameUz: data.name,
      nameRu: data.name,
      slug: slugify(data.name),
      iconUrl: data.iconUrl ?? existingCategory.iconUrl,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive ?? existingCategory.isActive,
    },
  });

  // Invalidate cache
  menuCache.clear();

  const updatedCategory = await getSerializedCategoryById(request.params.id);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'UPDATE_CATEGORY',
    entity: 'MenuCategory',
    entityId: request.params.id,
    oldValue,
    newValue: updatedCategory,
  });

  return reply.send(updatedCategory);
}

export async function handleSetCategoryActive(
  request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const { isActive } = request.body;

  const existingCategory = await prisma.menuCategory.findUnique({
    where: { id: request.params.id },
    include: {
      items: true,
    },
  });

  if (!existingCategory) {
    return reply.status(404).send({ error: 'Kategoriya topilmadi' });
  }

  const oldValue = serializeCategory(existingCategory);

  await prisma.menuCategory.update({
    where: { id: request.params.id },
    data: { isActive },
  });

  const updatedCategory = await getSerializedCategoryById(request.params.id);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: isActive ? 'ACTIVATE_CATEGORY' : 'DEACTIVATE_CATEGORY',
    entity: 'MenuCategory',
    entityId: request.params.id,
    oldValue,
    newValue: updatedCategory,
  });

  return reply.send(updatedCategory);
}

export async function handleDeleteCategory(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const existingCategory = await prisma.menuCategory.findUnique({
    where: { id: request.params.id },
    include: {
      items: true,
    },
  });

  if (!existingCategory) {
    return reply.status(404).send({ error: 'Kategoriya topilmadi' });
  }

  const oldValue = serializeCategory(existingCategory);

  await prisma.$transaction([
    prisma.menuCategory.update({
      where: { id: request.params.id },
      data: { isActive: false },
    }),
    prisma.menuItem.updateMany({
      where: { categoryId: request.params.id },
      data: {
        isActive: false,
        availabilityStatus: ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE as any,
      },
    }),
  ]);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'DELETE_CATEGORY',
    entity: 'MenuCategory',
    entityId: request.params.id,
    oldValue,
    newValue: { isActive: false },
  });

  return reply.status(204).send();
}

export async function handleCreateProduct(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const data = request.body as any;

  const category = await prisma.menuCategory.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    return reply.status(400).send({ error: 'Kategoriya topilmadi' });
  }

  const stockQuantity = data.stockQuantity || 0;
  const isActive = data.isActive ?? true;

  const product = await prisma.menuItem.create({
    data: {
      categoryId: data.categoryId,
      nameUz: data.name,
      nameRu: data.name,
      descriptionUz: data.description || '',
      descriptionRu: data.description || '',
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stockQuantity,
      isActive,
      imageUrl: data.imageUrl || null,
      weightText: data.weightText || null,
      badgeText: data.badgeText || null,
      isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false,
      isPopular: data.isPopular ?? false,
      isDiscounted: data.isDiscounted ?? Boolean(data.oldPrice),
      discountPercent: data.discountPercent ?? null,
      sortOrder: data.sortOrder ?? 0,
      availabilityStatus: normalizeAvailability({ isActive, stockQuantity }) as any,
    },
    include: { category: true },
  });

  // Invalidate cache
  menuCache.clear();

  const serializedProduct = serializeProduct(product);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'CREATE_PRODUCT',
    entity: 'MenuItem',
    entityId: product.id,
    newValue: serializedProduct,
  });

  return reply.status(201).send(serializedProduct);
}

export async function handleUpdateProduct(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const data = request.body as any;

  const existingProduct = await prisma.menuItem.findUnique({
    where: { id: request.params.id },
    include: { category: true },
  });

  if (!existingProduct) {
    return reply.status(404).send({ error: 'Taom topilmadi' });
  }

  const category = await prisma.menuCategory.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    return reply.status(400).send({ error: 'Kategoriya topilmadi' });
  }

  const oldValue = serializeProduct(existingProduct);
  const stockQuantity = data.stockQuantity || 0;
  const isActive = data.isActive ?? existingProduct.isActive;

  await prisma.menuItem.update({
    where: { id: request.params.id },
    data: {
      categoryId: data.categoryId,
      nameUz: data.name,
      nameRu: data.name,
      descriptionUz: data.description || '',
      descriptionRu: data.description || '',
      price: data.price,
      oldPrice: data.oldPrice ?? existingProduct.oldPrice ?? null,
      stockQuantity,
      isActive,
      imageUrl: data.imageUrl || null,
      weightText: data.weightText ?? existingProduct.weightText ?? null,
      badgeText: data.badgeText ?? existingProduct.badgeText ?? null,
      isFeatured: data.isFeatured ?? existingProduct.isFeatured,
      isNew: data.isNew ?? existingProduct.isNew,
      isPopular: data.isPopular ?? existingProduct.isPopular,
      isDiscounted: data.isDiscounted ?? existingProduct.isDiscounted ?? Boolean(data.oldPrice),
      discountPercent: data.discountPercent ?? existingProduct.discountPercent ?? null,
      sortOrder: data.sortOrder ?? existingProduct.sortOrder ?? 0,
      availabilityStatus: normalizeAvailability({ isActive, stockQuantity }) as any,
    },
  });

  // Invalidate cache
  menuCache.clear();

  const updatedProduct = await getSerializedProductById(request.params.id);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'UPDATE_PRODUCT',
    entity: 'MenuItem',
    entityId: request.params.id,
    oldValue,
    newValue: updatedProduct,
  });

  return reply.send(updatedProduct);
}

export async function handleSetProductActive(
  request: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const { isActive } = request.body;

  const existingProduct = await prisma.menuItem.findUnique({
    where: { id: request.params.id },
    include: { category: true },
  });

  if (!existingProduct) {
    return reply.status(404).send({ error: 'Taom topilmadi' });
  }

  const oldValue = serializeProduct(existingProduct);

  await prisma.menuItem.update({
    where: { id: request.params.id },
    data: {
      isActive,
      availabilityStatus: normalizeAvailability({
        isActive,
        stockQuantity: existingProduct.stockQuantity ?? 0,
      }) as any,
    },
  });

  const updatedProduct = await getSerializedProductById(request.params.id);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
    entity: 'MenuItem',
    entityId: request.params.id,
    oldValue,
    newValue: updatedProduct,
  });

  return reply.send(updatedProduct);
}

export async function handleDeleteProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const existingProduct = await prisma.menuItem.findUnique({
    where: { id: request.params.id },
    include: { category: true },
  });

  if (!existingProduct) {
    return reply.status(404).send({ error: 'Taom topilmadi' });
  }

  const oldValue = serializeProduct(existingProduct);

  await prisma.menuItem.update({
    where: { id: request.params.id },
    data: {
      isActive: false,
      availabilityStatus: ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE as any,
    },
  });

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'DELETE_PRODUCT',
    entity: 'MenuItem',
    entityId: request.params.id,
    oldValue,
    newValue: { isActive: false },
  });

  return reply.status(204).send();
}
