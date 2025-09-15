/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase; 
    const discountMultiplier = 1 - (discount || 0) / 100;
    return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller; 

    if (index === 0) {
        return profit * 0.15; // лидер
    } else if (index === 1 || index === 2) {
        return profit * 0.10; // 2-3 место
    } else if (index === total - 1) {
        return 0; // последний без бонуса
    } else {
        return profit * 0.05; // остальные
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
    if (!data 
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.products) 
        || !Array.isArray(data.purchase_records)
    ) {
        throw new Error("Некорректные входные данные");
    }

    // @TODO: Проверка наличия опций
    if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error("Не заданы функции расчета");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(s => ({
        seller_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0,
        top_products: []
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;

            seller.profit += profit;

            seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = +calculateBonus(index, sellerStats.length, seller).toFixed(2);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(s => ({
        seller_id: s.seller_id,
        name: s.name,
        revenue: +s.revenue.toFixed(2),
        profit: +s.profit.toFixed(2),
        sales_count: s.sales_count,
        top_products: s.top_products,
        bonus: s.bonus
    }));
}
