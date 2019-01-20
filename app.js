const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const Product = require('./models/product');
const Cart = require('./models/cart');
const _ = require('lodash');

const app = express();

mongoose.connect('mongodb://localhost:27017/shopping_cart', { useNewUrlParser: true });

app.use(express.json());

app.use(session({
  secret: 'shopify',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookies: { maxAge: 60*60*1000 }
}))

app.post('/product/fetch', (req, res) => {
  if (_.isEmpty(req.body) && !req.body.title && !req.body.inStockOnly) {
    return res.send('error');
  }

  let query_condition = req.body.title? { title: req.body.title } : req.body.inStockOnly? { inventory_count: { $gt: 0 } } : null ;

  Product.find(query_condition, '-__v').then((result) => {
    res.send(result);
  })
});

app.post('/product/insert', async (req, res) => {
  let products = req.body;

  async function valid_schema() {
    let error_list = [];
    for (let item of products) {
      let product = new Product(item);
      let error = product.validateSync();
      if (error) {
        error_list.push({product, error})
      }
    }
    return error_list;
  }

  let result = await valid_schema();

  if (!_.isEmpty(result)) {
    return res.send(result);
  }

  async function inserting() {
    let product_list = [];
    for (let item of products) {
      let product = new Product(item);
      await product.save();
      product_list.push(product.title);
    }
    return product_list;
  }

  inserting().then((prod) => {
    res.send({ 'message': `You have added ${prod} to the inventory`});
  }).catch(err => res.send(err));
});

app.post('/product/addItemToCart', (req, res) => {
  let cart = new Cart(req.session.cart? req.session.cart : {});

  Product.findOne({ title: req.body.title }, '-inventory_count -__v', (err, product) => {
    // add items to cart
    cart.addItem(product, product.id)
    req.session.cart = cart;
    res.send(req.session.cart);
  });
});

app.post('/product/checkout', async (req, res) => {
  let cart = req.session.cart;
  if (!cart) {
    return res.send({ 'message': 'No item in the cart' });
  }

  let cartItem = cart.items;
  let out_of_stock_list = [];
  let product_list = [];

  for (let item in cartItem) {
    let product = await Product.findById(cartItem[item].itemDetail._id)
    if (product.inventory_count < 0 || product.inventory_count - cartItem[item].quantity < 0){
      out_of_stock_list.push(`${cartItem[item].itemDetail.title} is out of stock`);
    }
  }

  if (!_.isEmpty(out_of_stock_list)) {
    return res.send(out_of_stock_list);
  }

  for (let item in cartItem) {
    await Product.findById(cartItem[item].itemDetail._id).then(product => {
      product.inventory_count -= cartItem[item].quantity;
      product.save();
      product_list.push({ title: cartItem[item].itemDetail.title, quantity: cartItem[item].quantity})
    })
  }

  res.send({
    'message': 'Thank you for shopping',
    'detail': product_list,
    'amount': cart.totalPrice
  });
  
});

app.listen(3000, () => {
  console.log(`Server is running`)
});