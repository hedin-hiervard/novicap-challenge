// @flow
import { find } from 'lodash'

type Currency = 'EUR' | 'USD';

type Product = {
    code: string,
    name: string,
    price: number,
    currency: Currency,
};

type PaidAmountDiscount = {
    product_code: string,
    type: 'PAID_AMOUNT_DEC',
    initial_amount: number,
    final_amount: number,
    min_amount: number,
};

type BulkDiscount = {
    product_code: string,
    type: 'BULK_DISCOUNT',
    min_amount: number,
    final_price: number,
    final_price_currency: Currency;
};

type Discount = PaidAmountDiscount | BulkDiscount;

type Operation = {
    product_code: string,
};

export default class Checkout {
    product_list: Array<Product>;
    discount_list: Array<Discount>;
    operations: Array<Operation> = [];
    total: number = 0;
    currency: Currency = 'EUR';

    constructor({
        product_list,
        discount_list,
    }: {
        product_list: Array<Product>,
        discount_list: Array<Discount>
    }) {
        this.product_list = product_list
        this.discount_list = discount_list
    }

    getProduct(product_code: string): ?Product {
        return find(this.product_list, { code: product_code })
    }

    /* update the total and currency fields */
    recalc() {
        const map = {}
        /* get total product count in the checkout */
        for(const op of this.operations) {
            const p = this.getProduct(op.product_code)
            if(!p) {
                throw new Error(`no such product_code: ${op.product_code} in the db`)
            }
            map[op.product_code] = map[op.product_code] || {
                qty: 0,
                price: p.price,
                currency: p.currency,
            }
            map[op.product_code].qty++
        }
        /* apply discounts */
        for(const discount of this.discount_list) {
            const m = map[discount.product_code]
            if(!m) { continue }
            if(discount.type === 'PAID_AMOUNT_DEC') {
                const div = Math.floor(m.qty / discount.initial_amount)
                m.qty -= div * discount.initial_amount
                m.qty += div * discount.final_amount
            } else if(discount.type === 'BULK_DISCOUNT') {
                if(m.qty >= discount.min_amount) {
                    m.price = discount.final_price
                    m.currency = discount.final_price_currency
                }
            }
        }

        /* calc total */
        this.total = 0
        delete this.currency
        for(const product_code in map) {
            const m = map[product_code]
            this.total += m.price * m.qty
            if(!this.currency) { this.currency = m.currency }
            if(this.currency !== m.currency) {
                throw new Error('currency conversion not supported')
            }
        }
    }

    /* add new product to the checkout */
    scan(product_code: string) {
        if(!this.getProduct(product_code)) {
            throw new Error(`no such product_code: ${product_code} in the db`)
        }
        this.operations.push({ product_code })
        this.recalc()
    }
}
