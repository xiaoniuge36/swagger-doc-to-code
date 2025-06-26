/**
 * @name 获取订单详情
 * @namespace order
 * @path /api/order/detail
 * @method GET
 * @update 2024-01-15
 */
export interface GetOrderDetailRequest {
  orderId: number;
}

export interface GetOrderDetailResponse {
  code: number;
  data: OrderDetail;
  message: string;
}

export interface OrderDetail {
  id: number;
  userId: number;
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  address: string;
  createTime: string;
  updateTime: string;
}

export interface OrderProduct {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}