function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalItem = oldCart.totalItem || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.addItem = function(item, id) {
        let oldItem = this.items[id];

        if (!oldItem) {
            this.items[id] = { itemDetail: item, quantity: 0, price:0 };
            oldItem = this.items[id];
        }
        oldItem.quantity++;
        oldItem.price = oldItem.itemDetail.price * oldItem.quantity;
        this.totalItem++;
        this.totalPrice += oldItem.itemDetail.price;
    }
};

module.exports = Cart;