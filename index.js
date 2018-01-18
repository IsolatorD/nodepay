const express = require('express');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');
const ejs = require('ejs');
const config = require('./config');

paypal.configure({
    mode: 'sandbox',
    client_id: config.PayNode.ClientId,
    client_secret: config.PayNode.ClientSecret
});

var port = process.env.PORT || 8089;
var app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/pay', (req, res) => {
    var name = req.body.name;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var phone = req.body.phone;
    var amount = req.body.amount;
    let payment = {
        'intent': 'sale',
        'payer': {
            'payment_method': 'paypal'
        },
        'redirect_urls': {
            'return_url': `https://nodepaypal.localtunnel.me/success?amount=${amount}&name=${name}&lastname=${lastname}`,
            'cancel_url': `https://nodepaypal.localtunnel.me/cancel`,
        },
        'transactions': [{
            'amount': {
                'currency': 'USD',
                'total': amount
            },
            'description': 'this is test'
        }]
    };
    paypal.payment.create(payment, (err, payment) => {
        if (err) {
            console.log(err.response);
            throw err;
        } else {
            for (var i = 0; i < payment.links.length; i++) {
            //Redirect user to this endpoint for redirect url
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
            console.log(payment);
        }
    })
});

app.get('/success', (req, res) => {
    var name = req.query.name;
    var lastname = req.query.lastname;
    var amount = req.query.amount;
    var payerId = req.query.PayerID;
    var paymentId = req.query.paymentId;
    var executePayment = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": amount
            }
        }]
    };
    paypal.payment.execute(paymentId, executePayment, (err, payment) => {
        if (err) {
            console.log(err.response);
            throw err;
        } else {
            console.log('Get Payment Response');
            console.log(JSON.stringify(payment));
        }
    });
    res.render('success', { name: name, lastname: lastname });    
});

app.get('/cancel', (req, res) => {
    res.render('cancel');
});


app.listen(port, () => {
    console.log(`Server running in port: ${port}`);    
});