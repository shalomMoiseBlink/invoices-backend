const express = require("express");
const router = express.Router();
const fs = require("fs");
const { createNewToken, createIntent, processPayment, getTransaction,createPayLink } = require("../models");
const { checkForUpdate, createFakeData,dueDate } = require("../utils")
const invoices = require("../storage/invoices.json");

router.post("/token", function (req, res, next) {
    return createNewToken().then((token) => {
        fs.writeFile("./storage/token.json", JSON.stringify(token), (err) => {
            if (err)
                console.log(err);
            else {
                res.send(token);
            }
        });

    })
});

router.post("/intent", function (req, res, next) {
    return createIntent(req.body)
        .then((intent) => {
            res.send(intent)
        })
})

// paying 
router.post("/process/", function (req, res, next) {
    return processPayment(req.body)
        .then((data) => {

            const url = Object.values(data)[0];
            checkForUpdate(url)
            res.redirect(url)
        }).catch((err) => {
            console.log(err)
        })
})

router.get("/transactions/:id", function (req, res, next) {
    return getTransaction(req.params.id)
        .then((transaction) => {
            res.send(transaction);
        })
}
)
//Paylinks

router.post("/paylink/", function (req, res, next) {
    return createPayLink(req.body)
        .then((paylink) => {
            res.send(paylink)
        })
})

// invoice managment
router.get("/invoices", function (req, res, next) {
    const invoices = fs.readFileSync('./storage/invoices.json', 'utf8');
    res.send(invoices);
})


router.get("/invoices/:id", function (req, res, next) {
    const invoice = invoices.filter((invoice) => invoice.id == req.params.id)[0]
    res.send(invoice);
})

router.patch("/invoices/:id", function (req, res, next) {
    const index = invoices.findIndex((invoice) => invoice.id == req.params.id);
    const invoice = invoices.filter((invoice) => invoice.id == req.params.id)[0];
    const toChange = req.body;
    for (item in toChange) {
        invoice[item] = toChange[item];
    }
    invoices[index] = invoice;
    fs.writeFile("./storage/invoices.json", JSON.stringify(invoices), (err) => {
        if (err)
            console.log(err);
        else {
            res.send({
                msg: "Invoice changed",
                changed: Object.keys(toChange),
                invoice
            });
        }
    });
});

//create new invoices
router.post("/invoices/refresh", function (req, res, next) {
    let {amount} = req.query;
    if(!amount) amount = 10;
    const invoiceArr = [];
for(i = 1; i <= amount;i++){
const invoice = createFakeData(dueDate());
invoiceArr.push(invoice);
}

fs.writeFile("./storage/invoices.json", JSON.stringify(invoiceArr), (err) => {
    if (err)
        console.log(err);
    else {
        res.send({
            msg: "New Invoices generated",
            invoices: invoiceArr
        });
    }
});
})


module.exports = router;