const express = require("express");
const router = express.Router();
const fs = require("fs");
const { createNewToken, createIntent, processPayment, getTransaction, createPayLink } = require("../models");
const { checkForUpdate, createFakeData, dueDate, createDate,updateFromNotification} = require("../utils")


router.post("/token", function (req, res, next) {
    return createNewToken().then((token) => {
        fs.writeFile("./storage/token.json", JSON.stringify(token), (err) => {
            if (err)
            res.status(400).send({ status: 400, msg: "Error in creating a token" })
            else {
                res.send(token);
            }
        })

    })
});

router.post("/intent", function (req, res, next) {
    return createIntent(req.body)
        .then((intent) => {
            res.send(intent)
        }).catch((err) => {
            const { status, data } = err.response;
            res.status(status).send({ status: status, msg: data.error })
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
            const { message, data } = err.response.data;
            let errorString = `${message}:\n`;
            for (item in data) {
                errorString += data[item][0] + ",\n";
            }
            errorString =  errorString.substring(0, errorString.length - 1) + ".";
            res.status(401).redirect(`http://localhost:3000/error?message=${errorString}`);

        })
})

router.get("/transactions/:id", function (req, res, next) {
    return getTransaction(req.params.id)
        .then((transaction) => {
            res.send(transaction);
        }).catch((err) => {
            const { status, data } = err.response;
            res.status(status).send({ status: status, msg: data.error })
        })
}
)
//Paylinks

router.post("/paylink/", function (req, res, next) {
    return createPayLink(req.body)
        .then((paylink) => {
            res.send(paylink)
        }).catch((err) => {
            const { status, data } = err.response;
            res.status(status).send({ status: status, msg: data.error })
        })
})

// invoice managment
router.get("/invoices", function (req, res, next) {
    const invoices = fs.readFileSync('./storage/invoices.json', 'utf8');
    if(!invoices)   res.status(404).send({ status: 404, msg: "Invoices not found." });
    res.send(invoices);
})


router.get("/invoices/:id", function (req, res, next) {
    const { invoices } = JSON.parse(fs.readFileSync('./storage/invoices.json', 'utf8'));
    const invoice = invoices.filter((invoice) => invoice.id == req.params.id)[0]
    if (invoice) {
        res.send(invoice);
    } else {
        res.status(404).send({ status: 404, msg: "Invoice not found." })
    }

})

router.post("/invoices/", function (req, res, next) {
    const { invoices, created_at } = JSON.parse(fs.readFileSync('./storage/invoices.json', 'utf8'));
    const newInvoice = createFakeData(dueDate());
    if (req.body.name) newInvoice.name = req.body.name;
    if (req.body.amount) newInvoice.amount = req.body.amount;
    if (req.body.email) newInvoice.email = req.body.email;
    if (req.body.dueDate) newInvoice.dueDate = req.body.dueDate;
    invoices.push(newInvoice)
    fs.writeFile("./storage/invoices.json", JSON.stringify({ created_at, invoices }), (err) => {
        if (err)
            res.status(404).send({ status: 401, msg: "Cannot create" })
        else {
            res.send({
                msg: "New Invoice generated",
                invoice: newInvoice
            });
        }
    });


})

router.patch("/invoices/:id", function (req, res, next) {
    const { invoices, created_at } = JSON.parse(fs.readFileSync('./storage/invoices.json', 'utf8'));
    const index = invoices.findIndex((invoice) => invoice.id == req.params.id);
    const invoice = invoices.filter((invoice) => invoice.id == req.params.id)[0];
    if (!invoice) {
        res.status(404).send({ status: 404, msg: "Invoice not found." })
    } else {

        const toChange = req.body;
        for (item in toChange) {
            invoice[item] = toChange[item];
        }
        invoices[index] = invoice;
        fs.writeFile("./storage/invoices.json", JSON.stringify({ created_at, invoices }), (err) => {
            if (err)
                res.status(404).send({ status: 404, msg: "Cannot Edit Invoice" })
            else {
                res.send({
                    msg: "Invoice changed",
                    changed: Object.keys(toChange),
                    invoice
                });
            }
        });
    }
});

//create new invoices
router.post("/invoices/refresh", function (req, res, next) {
    let { amount } = req.query;
    if (!amount) amount = 10;
    const invoiceArr = [];
    for (i = 1; i <= amount; i++) {
        const invoice = createFakeData(dueDate());
        invoiceArr.push(invoice);
    }
    const invoicesObj = {
        created_at: createDate(),
        invoices: invoiceArr
    }
    fs.writeFile("./storage/invoices.json", JSON.stringify(invoicesObj), (err) => {
        if (err)
            res.status(404).send({ status: 404, msg: "Cannot refresh invoices" })
        else {
            res.send({
                msg: "New Invoices generated",
                invoices: invoiceArr
            });
        }
    });
})

router.get("/invoicecheck", function (req, res, next) {
    const { invoices, created_at } = JSON.parse(fs.readFileSync('./storage/invoices.json', 'utf8'));
    const todaySDate = createDate();
    const unPaidInvoices = invoices.filter((invoice) => invoice.status !== "Paid").length;
    if (todaySDate === created_at && unPaidInvoices > 0) res.send({ status: 200, msg: "No Change Required" });
    else res.send({ status: 200, msg: "Reset Invoices" });
});

// webhook for paylinks

router.post("/paylink-notification", function (req, res, next) {
    const invoiceID = req.body.reference.split(" ID: ")[1];
    const { invoices, created_at } = JSON.parse(fs.readFileSync('./storage/invoices.json', 'utf8'));
    const index = invoices.findIndex((invoice) => invoice.id == invoiceID);
    const invoice = invoices.filter((invoice) => invoice.id == invoiceID)[0];
    console.log(invoiceID, invoice, index)
    if (!invoice) {
        res.status(404).send({ status: 404, msg: "Invoice not found." })
    } else {
        invoice.status = "Paid"
        invoices[index] = invoice;

        fs.writeFile("./storage/invoices.json", JSON.stringify({ created_at, invoices }), (err) => {
            if (err)
                console.log(err);
            else {
                res.send({
                    msg: "Invoice changed",
                    changed: "Status",
                    invoice
                });
            }
        });
    }

})
// payment notificatyion 
router.post("/payment-notification", function(req,res,next){

 
    updateFromNotification(req.body)

    res.send({notification: "recieved"})
})
module.exports = router;