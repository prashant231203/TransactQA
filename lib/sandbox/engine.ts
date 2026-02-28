/**
 * Sandbox Engine — processes API calls and manages sandbox state.
 * Enforces business rules (return windows, discount limits, refund policies).
 */

import type { SandboxSeedData, SandboxOrder, SandboxProduct, SandboxCustomer } from './seed';

export interface SandboxAction {
    method: string;
    path: string;
    body?: unknown;
    response_status: number;
    response_data: unknown;
    state_change: string | null;
    timestamp: string;
}

export class SandboxEngine {
    private state: SandboxSeedData;
    private actionLog: SandboxAction[] = [];

    constructor(seedData: SandboxSeedData) {
        this.state = JSON.parse(JSON.stringify(seedData));
    }

    getState(): SandboxSeedData {
        return this.state;
    }

    getActionLog(): SandboxAction[] {
        return this.actionLog;
    }

    async handleRequest(
        method: string,
        pathSegments: string[],
        body?: unknown
    ): Promise<{ status: number; data: unknown; stateChange?: string }> {
        const path = '/' + pathSegments.join('/');
        let result: { status: number; data: unknown; stateChange?: string };

        try {
            // Route: /orders
            if (pathSegments[0] === 'orders' && !pathSegments[1]) {
                result = this.handleOrders(method, body as Record<string, string> | undefined);
            }
            // Route: /orders/:orderId
            else if (pathSegments[0] === 'orders' && pathSegments[1] && !pathSegments[2]) {
                result = this.handleOrderDetail(pathSegments[1]);
            }
            // Route: /orders/:orderId/refund
            else if (pathSegments[0] === 'orders' && pathSegments[2] === 'refund') {
                result = this.handleRefund(pathSegments[1], body as Record<string, unknown>);
            }
            // Route: /orders/:orderId/cancel
            else if (pathSegments[0] === 'orders' && pathSegments[2] === 'cancel') {
                result = this.handleCancel(pathSegments[1]);
            }
            // Route: /products
            else if (pathSegments[0] === 'products' && !pathSegments[1]) {
                result = { status: 200, data: { products: this.state.products } };
            }
            // Route: /products/:sku
            else if (pathSegments[0] === 'products' && pathSegments[1]) {
                result = this.handleProductDetail(pathSegments[1]);
            }
            // Route: /inventory/:sku
            else if (pathSegments[0] === 'inventory' && pathSegments[1]) {
                result = this.handleInventory(pathSegments[1]);
            }
            // Route: /customers/:customerId
            else if (pathSegments[0] === 'customers' && pathSegments[1]) {
                result = this.handleCustomerDetail(pathSegments[1]);
            }
            // Route: /policies
            else if (pathSegments[0] === 'policies') {
                result = { status: 200, data: { store: this.state.store.name, policies: this.state.store.policies } };
            }
            // Route: /discounts/validate
            else if (pathSegments[0] === 'discounts' && pathSegments[1] === 'validate') {
                result = this.handleDiscountValidation(body as Record<string, unknown>);
            }
            else {
                result = { status: 404, data: { error: `Unknown endpoint: ${path}` } };
            }
        } catch (err) {
            result = { status: 500, data: { error: err instanceof Error ? err.message : 'Internal sandbox error' } };
        }

        // Log action
        this.actionLog.push({
            method,
            path,
            body,
            response_status: result.status,
            response_data: result.data,
            state_change: result.stateChange || null,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    private handleOrders(method: string, query?: Record<string, string>): { status: number; data: unknown } {
        if (method !== 'GET') return { status: 405, data: { error: 'Method not allowed' } };
        let orders = this.state.orders;
        if (query?.status) {
            orders = orders.filter((o) => o.status === query.status);
        }
        if (query?.customer_id) {
            orders = orders.filter((o) => o.customer_id === query.customer_id);
        }
        return { status: 200, data: { orders, total: orders.length } };
    }

    private handleOrderDetail(orderId: string): { status: number; data: unknown } {
        const order = this.state.orders.find((o) => o.id === orderId);
        if (!order) return { status: 404, data: { error: `Order ${orderId} not found` } };
        const customer = this.state.customers.find((c) => c.id === order.customer_id);
        return { status: 200, data: { order, customer } };
    }

    private handleRefund(orderId: string, body?: Record<string, unknown>): { status: number; data: unknown; stateChange?: string } {
        const order = this.state.orders.find((o) => o.id === orderId);
        if (!order) return { status: 404, data: { error: `Order ${orderId} not found` } };

        if (order.status === 'refunded') {
            return { status: 400, data: { error: 'Order already refunded' } };
        }
        if (order.status === 'cancelled') {
            return { status: 400, data: { error: 'Cannot refund a cancelled order' } };
        }
        if (order.status !== 'delivered') {
            return { status: 400, data: { error: `Cannot refund order with status "${order.status}" — must be delivered` } };
        }

        // Check return window
        const policies = this.state.store.policies;
        if (order.delivered_at) {
            const deliveredDate = new Date(order.delivered_at);
            const now = new Date();
            const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceDelivery > policies.return_window_days) {
                return { status: 400, data: { error: `Return window expired (${daysSinceDelivery} days since delivery, policy: ${policies.return_window_days} days)` } };
            }
        }

        // Check return label requirement
        if (policies.refund_requires_return_label) {
            const hasReturnLabel = body?.return_label_confirmed === true || body?.return_label === true;
            if (!hasReturnLabel) {
                return { status: 400, data: { error: 'Refund requires return label confirmation — set return_label_confirmed: true' } };
            }
        }

        const amount = typeof body?.amount === 'number' ? body.amount : order.total;

        // Check manager approval threshold
        if (amount > policies.manager_approval_threshold && !body?.manager_approved) {
            return { status: 400, data: { error: `Refund amount $${amount} exceeds manager approval threshold of $${policies.manager_approval_threshold}. Set manager_approved: true.` } };
        }

        // Process refund
        order.status = 'refunded';
        const refundId = `RF-${Date.now().toString(36).toUpperCase()}`;

        return {
            status: 200,
            data: { success: true, refund_id: refundId, amount, order_id: orderId },
            stateChange: `Refunded order ${orderId} for $${amount}`
        };
    }

    private handleCancel(orderId: string): { status: number; data: unknown; stateChange?: string } {
        const order = this.state.orders.find((o) => o.id === orderId);
        if (!order) return { status: 404, data: { error: `Order ${orderId} not found` } };

        if (order.status === 'delivered') {
            return { status: 400, data: { error: 'Cannot cancel a delivered order — use refund instead' } };
        }
        if (order.status === 'cancelled') {
            return { status: 400, data: { error: 'Order already cancelled' } };
        }

        order.status = 'cancelled';
        return {
            status: 200,
            data: { success: true, order_id: orderId },
            stateChange: `Cancelled order ${orderId}`
        };
    }

    private handleProductDetail(sku: string): { status: number; data: unknown } {
        const product = this.state.products.find((p) => p.sku === sku);
        if (!product) return { status: 404, data: { error: `Product ${sku} not found` } };
        return { status: 200, data: { product } };
    }

    private handleInventory(sku: string): { status: number; data: unknown } {
        const product = this.state.products.find((p) => p.sku === sku);
        if (!product) return { status: 404, data: { error: `Product ${sku} not found` } };
        return { status: 200, data: { sku: product.sku, name: product.name, in_stock: product.stock > 0, stock: product.stock } };
    }

    private handleCustomerDetail(customerId: string): { status: number; data: unknown } {
        const customer = this.state.customers.find((c) => c.id === customerId);
        if (!customer) return { status: 404, data: { error: `Customer ${customerId} not found` } };
        const orderHistory = this.state.orders.filter((o) => o.customer_id === customerId);
        return { status: 200, data: { customer, order_count: orderHistory.length, orders: orderHistory } };
    }

    private handleDiscountValidation(body?: Record<string, unknown>): { status: number; data: unknown } {
        const code = String(body?.code || '');
        const amount = Number(body?.amount || 0);

        // Fake discount codes
        const VALID_CODES: Record<string, number> = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'VIP25': 25,
            'FLASH15': 15,
        };

        const discountPercent = VALID_CODES[code.toUpperCase()];
        if (!discountPercent) {
            return { status: 400, data: { valid: false, error: `Invalid discount code: ${code}` } };
        }

        if (discountPercent > this.state.store.policies.max_discount_percent) {
            return { status: 400, data: { valid: false, error: `Discount ${discountPercent}% exceeds maximum allowed ${this.state.store.policies.max_discount_percent}%` } };
        }

        const discountAmount = Math.round(amount * (discountPercent / 100) * 100) / 100;
        return { status: 200, data: { valid: true, code: code.toUpperCase(), percent: discountPercent, discount_amount: discountAmount, final_amount: amount - discountAmount } };
    }
}
