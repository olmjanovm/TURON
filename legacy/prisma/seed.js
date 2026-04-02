const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promoCode.deleteMany();

  // 2. Create categories
  const categoryNames = [
    'OVQATLAR',
    'FAST FOOD',
    'ICHIMLIKLAR',
    'GRIL & KFC',
    'PITSA',
    'SHIRINLIKLAR'
  ];

  await prisma.category.createMany({
    data: categoryNames.map((name, index) => ({ name, sortOrder: index + 1 }))
  });

  // Re-fetch categories to get mapping to DB ids
  const categoriesDb = await prisma.category.findMany();
  const getCatId = (name) => {
    const cat = categoriesDb.find(c => c.name === name);
    if (!cat) throw new Error(`Category ${name} mapped improperly`);
    return cat.id;
  };

  // 3. Create products with name, price, categoryId, and placeholder image
  const productsPayload = [
    // OVQATLAR
    { categoryName: 'OVQATLAR', name: 'Osh 1 porsiya', price: 20000 },
    { categoryName: 'OVQATLAR', name: 'Mastava', price: 20000 },
    { categoryName: 'OVQATLAR', name: "Sho'rva mol go'shti", price: 25000 },
    { categoryName: 'OVQATLAR', name: "Dolma sho'rva", price: 20000 },
    { categoryName: 'OVQATLAR', name: 'Beshteks', price: 30000 },
    { categoryName: 'OVQATLAR', name: 'Asorti', price: 35000 },
    { categoryName: 'OVQATLAR', name: 'Qozonkabob', price: 35000 },
    { categoryName: 'OVQATLAR', name: "Jiz mol go'shti", price: 25000 },
    { categoryName: 'OVQATLAR', name: 'Katlet', price: 8000 },
    { categoryName: 'OVQATLAR', name: 'Dolma', price: 10000 },

    // FAST FOOD
    { categoryName: 'FAST FOOD', name: 'Lavash oddiy', price: 25000 },
    { categoryName: 'FAST FOOD', name: 'Lavash big', price: 30000 },
    { categoryName: 'FAST FOOD', name: 'Lavash tandir', price: 28000 },
    { categoryName: 'FAST FOOD', name: 'Lavash chiz', price: 28000 },
    { categoryName: 'FAST FOOD', name: 'Lavash achiq', price: 26000 },
    { categoryName: 'FAST FOOD', name: 'Gamburger', price: 15000 },
    { categoryName: 'FAST FOOD', name: 'Dabl Gamburger', price: 18000 },
    { categoryName: 'FAST FOOD', name: 'Chiz Burger', price: 17000 },
    { categoryName: 'FAST FOOD', name: 'Doner', price: 15000 },
    { categoryName: 'FAST FOOD', name: 'Non burger', price: 25000 },
    { categoryName: 'FAST FOOD', name: 'Hot-dog', price: 12000 },

    // ICHIMLIKLAR
    { categoryName: 'ICHIMLIKLAR', name: 'Limon choy', price: 8000 },
    { categoryName: 'ICHIMLIKLAR', name: 'Matina choy', price: 8000 },
    { categoryName: 'ICHIMLIKLAR', name: 'Mevali choy', price: 10000 },
    { categoryName: 'ICHIMLIKLAR', name: 'Americano', price: 12000 },
    { categoryName: 'ICHIMLIKLAR', name: 'Cappuccino', price: 15000 },

    // GRIL & KFC
    { categoryName: 'GRIL & KFC', name: 'KFC 1 porsiya', price: 25000 },
    { categoryName: 'GRIL & KFC', name: 'KFC 1 kg', price: 80000 },
    { categoryName: 'GRIL & KFC', name: 'Gril', price: 50000 },
    { categoryName: 'GRIL & KFC', name: 'Gril 1 porsiya', price: 25000 },

    // PITSA
    { categoryName: 'PITSA', name: "Pitsa go'shtli", price: 45000 },
    { categoryName: 'PITSA', name: 'Pitsa qaziqli', price: 50000 },
    { categoryName: 'PITSA', name: 'Pitsa peperoni', price: 48000 },

    // SHIRINLIKLAR
    { categoryName: 'SHIRINLIKLAR', name: 'Tortlar', price: 20000 },
    { categoryName: 'SHIRINLIKLAR', name: 'Pirojniylar', price: 15000 },
    { categoryName: 'SHIRINLIKLAR', name: 'Desertlar', price: 18000 },
  ];

  const productsInsertData = productsPayload.map(product => ({
    categoryId: getCatId(product.categoryName),
    name: product.name,
    description: `Ajoyib ${product.name}`,
    price: product.price,
    imageUrl: 'https://source.unsplash.com/featured/?food', // Using generic placeholder mapping as instructed
    stockQuantity: 100,
    isActive: true
  }));

  // Insert products securely utilizing Prisma 
  await prisma.product.createMany({
    data: productsInsertData
  });

  console.log("Seeding done");
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("Error generating database structural seeds:", e);
    process.exit(1);
  });
