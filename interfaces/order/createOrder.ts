/**
 * @name 创建订单
 * @namespace order
 * @path /api/order/create
 * @method POST
 * @update 2024-01-15
 */
export interface CreateOrderRequest {
  userId: number;
  products: OrderProduct[];
  address: string;
}

export interface CreateOrderResponse {
  code: number;
  data: Order;
  message: string;
}

export interface OrderProduct {
  productId: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  createTime: string;
}