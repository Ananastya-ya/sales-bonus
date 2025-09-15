/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase; 
   // @TODO: Расчет выручки от операции
   const discountMultiplier = 1 - (discount / 100);
   const revenue = sale_price * quantity * discountMultiplier;
   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller; 
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
       return profit * 0.15;
   } else if (index === 1 || index === 2) {
       return profit * 0.10;
   } else if (index === total - 1) {
       return 0;
   } else {
       return profit * 0.05;
   }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data');
    }
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Invalid sellers data');
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Invalid products data');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Invalid purchase records data');
    }

    // @TODO: Проверка наличия опций
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Required functions are missing in options');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    sellerStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });

    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            // Расчет себестоимости
            const cost = product.purchase_price * item.quantity;
            
            // Расчет выручки
            const revenue = calculateRevenue(item, product);
            
            // Расчет прибыли
            const profit = revenue - cost;

            // Обновление статистики продавца
            seller.revenue += revenue;
            seller.profit += profit;

            // Учет проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
        
        // Формирование топ-10 товаров
        const productsArray = Object.entries(seller.products_sold);
        const topProducts = productsArray
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        seller.top_products = topProducts;
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: Number(seller.revenue.toFixed(2)),
        profit: Number(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: Number(seller.bonus.toFixed(2))
    }));
}
