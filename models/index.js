const axios = require('axios');
const { getToken } = require("../utils")
require('dotenv').config()
const instance = axios.create({
    baseURL: `https://${process.env.BLINK_ENV}.blinkpayment.co.uk/api/pay/v1`
});

exports.createNewToken = () => {

    return instance.post('/tokens',
        {
            api_key: process.env.API_KEY,
            secret_key: process.env.SECRET_KEY,
            application_name: "Invoice Demo Test",
            source_site: "Shalom-local",
            payment_api_status: true,
            send_blink_receipt: true,
            address_postcode_required: true,
            enable_moto_payments: true
        }
    ).then(({ data }) => {
        return data;
    })
        .catch((err) => err);

}


exports.createIntent = (body) => {

    const { access_token } = getToken();
    if (body.transactionType && body.transactionType === "VERIFY") body.amount = 0;
    if (!body.card_layout) body.card_layout = "single-line"
    return instance.post('/intents',
        body,
        {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        }
    ).then(({ data }) => {
        return data;

    }).then((res) => res).catch((err) => {
            return err.response.data
        });


}
exports.processPayment = (body) => {

    const { access_token } = getToken();
    return instance.post(`/${body.resource}`, body, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Charset": "",
        }
    }).then((res) => {
        return res.data
    }).catch((err) => {

        console.log("Error is here: ", err)
    })

}
exports.getTransaction = (id) => {
    const { access_token } = getToken();
    return instance.get(`/transactions/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Charset": "",
        }
    }).then((res) => {
        return res.data
    })
}

exports.createPayLink = (body) => {
    const { access_token } = getToken();
    return axios.post(`https://${process.env.BLINK_ENV}.blinkpayment.co.uk/api/paylink/v1/paylinks`,
        body, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Charset": "",
        }
    }).then((res) => {
        return res.data
    }).catch((err) => {

        console.log("Error is here: ", err)
    })
}