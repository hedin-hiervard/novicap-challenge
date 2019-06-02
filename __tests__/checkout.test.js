// @flow

import fs from 'fs'
import Checkout from 'checkout'

function createCO() {
    const product_list = JSON.parse(fs.readFileSync('data/products.json', 'utf-8'))
    const discount_list = JSON.parse(fs.readFileSync('data/discounts.json', 'utf-8'))
    return new Checkout({ product_list, discount_list })
}

describe('checkout', () => {
    it('VOUCHER, TSHIRT, MUG equals 32.50 EUR', () => {
        const co = createCO()
        co.scan('VOUCHER')
        co.scan('TSHIRT')
        co.scan('MUG')
        expect(co.total).toEqual(32.5)
        expect(co.currency).toEqual('EUR')
    })

    it('VOUCHER, TSHIRT, VOUCHER equals 25.00 EUR', () => {
        const co = createCO()
        co.scan('VOUCHER')
        co.scan('TSHIRT')
        co.scan('VOUCHER')
        expect(co.total).toEqual(30.0)
        expect(co.currency).toEqual('EUR')
    })

    it('TSHIRT, TSHIRT, TSHIRT, VOUCHER, TSHIRT equals 81.00 EUR', () => {
        const co = createCO()
        co.scan('TSHIRT')
        co.scan('TSHIRT')
        co.scan('TSHIRT')
        co.scan('VOUCHER')
        co.scan('TSHIRT')
        expect(co.total).toEqual(81.0)
        expect(co.currency).toEqual('EUR')
    })

    it('VOUCHER, TSHIRT, VOUCHER, VOUCHER, MUG, TSHIRT, TSHIRT equals 74.50 EUR', () => {
        const co = createCO()
        co.scan('VOUCHER')
        co.scan('TSHIRT')
        co.scan('VOUCHER')
        co.scan('VOUCHER')
        co.scan('MUG')
        co.scan('TSHIRT')
        co.scan('TSHIRT')
        expect(co.total).toEqual(74.50)
        expect(co.currency).toEqual('EUR')
    })

    it('wrong product code should throw', () => {
        const co = createCO()
        expect(() => {
            co.scan('CHOCOLATE')
        }).toThrow()
    })

    it('no currency conversion should be supported', () => {
        const product_list = [ {
            code: 'PR1',
            name: 'product 1',
            price: 10,
            currency: 'USD',
        }, {
            code: 'PR2',
            name: 'product 2',
            price: 20,
            currency: 'EUR',
        }]
        const discount_list = []
        const co = new Checkout({ product_list, discount_list })

        co.scan('PR1')
        expect(() => {
            co.scan('PR2')
        }).toThrow()
    })
})
