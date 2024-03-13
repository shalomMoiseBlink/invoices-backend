const express = require("express");
const router = express.Router();
const fs = require("fs");
const { createNewToken, createIntent, processPayment, getTransaction,createPayLink } = require("../models");
const { checkForUpdate } = require("../utils")
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



module.exports = router;