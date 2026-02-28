/**
 * Sandbox Seed Data Generator
 * Creates realistic fake commerce data for sandbox sessions.
 */

export interface SandboxProduct {
    sku: string;
    name: string;
    price: number;
    stock: number;
    category: string;
}

export interface SandboxCustomer {
    id: string;
    name: string;
    email: string;
    tier: 'standard' | 'premium' | 'vip';
    lifetime_spend: number;
}

export interface SandboxOrder {
    id: string;
    customer_id: string;
    items: Array<{ sku: string; name: string; quantity: number; unit_price: number }>;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    created_at: string;
    delivered_at: string | null;
}

export interface StorePolicies {
    return_window_days: number;
    max_discount_percent: number;
    refund_requires_return_label: boolean;
    manager_approval_threshold: number;
    free_shipping_minimum: number;
}

export interface SandboxSeedData {
    store: { name: string; policies: StorePolicies };
    products: SandboxProduct[];
    customers: SandboxCustomer[];
    orders: SandboxOrder[];
}

const PRODUCT_CATALOG: Array<{ name: string; price: number; category: string }> = [
    { name: 'Kitchen Pro 3000 Blender', price: 189.99, category: 'Kitchen' },
    { name: 'ErgoComfort Office Chair', price: 449.99, category: 'Furniture' },
    { name: 'AirPure HEPA Filter System', price: 299.99, category: 'Home' },
    { name: 'SmartBrew Coffee Maker', price: 129.99, category: 'Kitchen' },
    { name: 'UltraClean Vacuum Pro', price: 349.99, category: 'Home' },
    { name: 'NoiseFree Wireless Headphones', price: 249.99, category: 'Electronics' },
    { name: 'FitTrack Smart Scale', price: 79.99, category: 'Health' },
    { name: 'PowerMax Portable Charger 20K', price: 59.99, category: 'Electronics' },
    { name: 'LuxeSleep Memory Foam Pillow', price: 89.99, category: 'Bedding' },
    { name: 'ProGrip Resistance Band Set', price: 34.99, category: 'Fitness' },
    { name: 'ClearView 4K Webcam', price: 119.99, category: 'Electronics' },
    { name: 'BreezeAir Portable Fan', price: 64.99, category: 'Home' },
    { name: 'AquaFlask Insulated Bottle 32oz', price: 29.99, category: 'Outdoor' },
    { name: 'SmartLock Pro Deadbolt', price: 199.99, category: 'Security' },
    { name: 'QuietCool Tower Fan', price: 144.99, category: 'Home' },
    { name: 'GlowUp LED Desk Lamp', price: 54.99, category: 'Office' },
    { name: 'SpeedMax USB-C Hub 7-in-1', price: 44.99, category: 'Electronics' },
    { name: 'ComfortZone Heated Blanket', price: 74.99, category: 'Bedding' },
    { name: 'FreshSeal Vacuum Food Bags 50pk', price: 24.99, category: 'Kitchen' },
    { name: 'TrailBlazer Hiking Backpack 40L', price: 109.99, category: 'Outdoor' },
];

const CUSTOMER_NAMES = [
    { name: 'Marcus Rodriguez', email: 'marcus.r@email.com' },
    { name: 'Sandra Chen', email: 'sandra.c@email.com' },
    { name: 'James O\'Brien', email: 'james.ob@email.com' },
    { name: 'Priya Patel', email: 'priya.p@email.com' },
    { name: 'David Kowalski', email: 'david.k@email.com' },
];

function generateSku(index: number): string {
    return `SKU-${String(index + 1000).padStart(5, '0')}`;
}

function generateOrderId(): string {
    const letters = ['KA', 'OB', 'RC', 'DL', 'WH'];
    const prefix = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${num}`;
}

function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

export function generateSeedData(): SandboxSeedData {
    const products: SandboxProduct[] = PRODUCT_CATALOG.map((p, i) => ({
        sku: generateSku(i),
        name: p.name,
        price: p.price,
        stock: Math.floor(5 + Math.random() * 200),
        category: p.category,
    }));

    const customers: SandboxCustomer[] = CUSTOMER_NAMES.map((c, i) => ({
        id: `cust-${i + 1}`,
        name: c.name,
        email: c.email,
        tier: (['standard', 'standard', 'premium', 'premium', 'vip'] as const)[i],
        lifetime_spend: Math.round((500 + Math.random() * 15000) * 100) / 100,
    }));

    // Generate 8 orders with various statuses
    const orders: SandboxOrder[] = [
        createOrder(customers[0].id, [products[0]], 'delivered', 5),
        createOrder(customers[0].id, [products[3], products[7]], 'shipped', 2),
        createOrder(customers[1].id, [products[5]], 'delivered', 15),
        createOrder(customers[2].id, [products[1]], 'processing', 1),
        createOrder(customers[2].id, [products[9], products[12]], 'delivered', 30),
        createOrder(customers[3].id, [products[4]], 'delivered', 8),
        createOrder(customers[3].id, [products[10]], 'cancelled', 3),
        createOrder(customers[4].id, [products[2], products[14]], 'pending', 0),
    ];

    return {
        store: {
            name: 'TechMart Pro',
            policies: {
                return_window_days: 30,
                max_discount_percent: 25,
                refund_requires_return_label: true,
                manager_approval_threshold: 100,
                free_shipping_minimum: 75,
            },
        },
        products,
        customers,
        orders,
    };
}

function createOrder(
    customerId: string,
    prods: SandboxProduct[],
    status: SandboxOrder['status'],
    daysOld: number
): SandboxOrder {
    const items = prods.map((p) => ({
        sku: p.sku,
        name: p.name,
        quantity: 1 + Math.floor(Math.random() * 3),
        unit_price: p.price,
    }));
    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    return {
        id: generateOrderId(),
        customer_id: customerId,
        items,
        total: Math.round(total * 100) / 100,
        status,
        created_at: daysAgo(daysOld),
        delivered_at: status === 'delivered' ? daysAgo(Math.max(0, daysOld - 2)) : null,
    };
}
