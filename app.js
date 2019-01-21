const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const Product = require('./models/product');
const Cart = require('./models/cart');
const _ = require('lodash');

const app = express();
const port = process.env.PORT;

mongoose.connect(process.env_MONGODB_URI, { useNewUrlParser: true });

app.use(express.json());

app.use(session({
  secret: 'shopify',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookies: { maxAge: 60*60*1000 }
}))

app.get('/', (req, res) => {
  res.send(`The app is running on ${port}`)
})

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
  let product_list = [];
  let error_list = [];

  for (let item of products) {
    let product = new Product(item);
    let error = product.validateSync();
    if (error) {
      error_list.push({product, error})
    }
  }

  if (!_.isEmpty(error_list)) {
    return res.send(error_list);
  }

  for (let item of products) {
    await Product.findOne({ title: item.title }).then((product) => {
      if (_.isEmpty(product)) {
        new Product(item).save();
      } else {
        product.inventory_count += item.inventory_count;
        product.price = item.price;
        product.save();
      }
      product_list.push(item.title);
    });
  }

  res.send({ 'message': `You have added ${product_list} to the inventory` });

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

app.listen(port, () => {
  console.log(`Server is running on ${port}`)
});