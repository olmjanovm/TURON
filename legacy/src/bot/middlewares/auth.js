const prisma = require('../../database/client');

module.exports = async function auth(ctx, next) {
  try {
    if (!ctx.from) {
      return next();
    }

    const telegramId = String(ctx.from.id);

    // Search for user in the database
    let user = await prisma.user.findUnique({
      where: { telegramId }
    });

    // Create a new user if one doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: ctx.from.first_name || 'User',
          phone: '', // Default empty string to satisfy schema requirements
          language: 'uz',
          isAdmin: false,
          isCourier: false
        }
      });
    }

    // Attach user object to ctx state
    ctx.state.user = user;

    // Set role
    if (user.isAdmin) {
      ctx.state.role = 'admin';
    } else if (user.isCourier) {
      ctx.state.role = 'courier';
    } else {
      ctx.state.role = 'customer';
    }

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Continue execution to not block the bot entirely on auth failure,
    // though subsequent middlewares expecting ctx.state.user might need safe-guards.
    return next();
  }
};
