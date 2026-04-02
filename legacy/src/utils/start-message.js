function getStartMessage(role, user) {
    const nameStr = user?.name ? ` ${user.name}` : '';
    
    if (role === 'admin') {
        return `Xush kelibsiz, Hurmatli admin${nameStr}! 🛠\n\nRestoran boshqaruvi va hisobotlarni ko'rish uchun quyidagi tugmani bosing.`;
    } else if (role === 'courier') {
        return `Xush kelibsiz${nameStr}! 🚚\n\nSizga biriktirilgan buyurtmalar va yetkazib berish xaritasini ochish uchun tugmani bosing.`;
    } else {
        return `Assalomu alaykum${nameStr}, Turon Kafesiga xush kelibsiz! ✨\n\nMazali taomlarimizni ko'rish va buyurtma berish uchun "Ilovani ochish" tugmasini bosing.`;
    }
}

module.exports = { getStartMessage };
