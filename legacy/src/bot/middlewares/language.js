const translations = {
  uz: {
    welcome: 'Xush kelibsiz! Bot ishlayapti.',
    menu: 'Menyu',
    choose_language: 'Tilni tanlang'
  },
  ru: {
    welcome: 'Добро пожаловать! Бот работает.',
    menu: 'Меню',
    choose_language: 'Выберите язык'
  }
};

module.exports = async function language(ctx, next) {
  // Read localized language from ctx.state.user injected by Auth middleware
  const userLang = (ctx.state.user && ctx.state.user.language) ? ctx.state.user.language : 'uz';
  ctx.state.locale = userLang;

  // Add the translation helper
  ctx.t = (key) => {
    return translations[ctx.state.locale]?.[key] || key;
  };

  return next();
};
