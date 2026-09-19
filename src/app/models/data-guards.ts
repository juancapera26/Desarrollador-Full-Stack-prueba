import { Cart } from './cart.model';
import { CartItem } from './cart-item.model';
import { Order, OrderItem } from './order.model';
import { Product } from './product.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  const id = value['id'];
  const name = value['name'];
  const description = value['description'];
  const price = value['price'];
  const stock = value['stock'];
  const image = value['image'];
  return Number.isInteger(id)
    && typeof name === 'string'
    && typeof description === 'string'
    && isFiniteNumber(price)
    && typeof stock === 'number'
    && Number.isInteger(stock)
    && stock >= 0
    && typeof image === 'string';
}

export function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;
  const product = value['product'];
  const quantity = value['quantity'];
  return isProduct(product) && typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0;
}

export function isCart(value: unknown): value is Cart {
  if (!isRecord(value)) return false;
  const userId = value['userId'];
  const items = value['items'];
  return typeof userId === 'string' && Array.isArray(items) && items.every(isCartItem);
}

function isOrderItem(value: unknown): value is OrderItem {
  if (!isRecord(value)) return false;
  const productId = value['productId'];
  const name = value['name'];
  const price = value['price'];
  const quantity = value['quantity'];
  const subtotal = value['subtotal'];
  return Number.isInteger(productId)
    && typeof name === 'string'
    && isFiniteNumber(price)
    && typeof quantity === 'number'
    && Number.isInteger(quantity)
    && quantity > 0
    && isFiniteNumber(subtotal);
}

export function isOrder(value: unknown): value is Order {
  if (!isRecord(value)) return false;
  const id = value['id'];
  const userId = value['userId'];
  const status = value['status'];
  const items = value['items'];
  const total = value['total'];
  const createdAt = value['createdAt'];
  return typeof id === 'string'
    && typeof userId === 'string'
    && status === 'CONFIRMED'
    && Array.isArray(items)
    && items.every(isOrderItem)
    && isFiniteNumber(total)
    && typeof createdAt === 'string';
}
