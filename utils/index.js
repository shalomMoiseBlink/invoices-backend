const fs = require("fs");
const axios = require("axios");
const getToken = () => {
  try {
    const data = fs.readFileSync('./storage/token.json', 'utf8');
    return JSON.parse(data)
  } catch (err) {
    console.error(err);
  }
}

const storeToken = (token) => {
  const { access_token } = token.token
  const content = access_token
  fs.writeFile('./storage/token.json', content, err => {
    if (err) {
      console.error(err);
    }
    // file written successfully
  });
}


const checkForUpdate = (url) => {
  if (url) {
    const responObj = {};
    url.split("?")[1].split("&").map((datum) => {
      const [key, value] = datum.split("=");
      return { [key]: value }
    }).forEach((item) => {
      const key = Object.keys(item)[0];

      responObj[key] = item[key]
    })
    console.log(responObj)
    if (responObj.merchant_data) {
      const merchantData = JSON.parse(decodeURIComponent(decodeURIComponent(responObj.merchant_data)));
      update(merchantData, responObj.status, responObj.transaction_id )
    } return '';
  }
}

const updateFromNotification = (notifcation) => {
  const { status, merchant_data } = notifcation;
  const decodedJSONString = decodeURIComponent(decodeURIComponent(merchant_data));
  const merchantData = JSON.parse(decodedJSONString.split("+").join(""));
  update(merchantData, status )
}
const createDate = () => {
  const currentDate = new Date();

  // Extract day, month, and year
  const day = currentDate.getDate().toString().padStart(2, '0'); // Ensure 2 digits with leading zero if needed
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed, so add 1
  const year = currentDate.getFullYear();

  // Combine into the desired format
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
}
require('dotenv').config();
const update =(merchantData, txStatus, transaction_id) =>{
  if ((merchantData.payment_type === "direct-debit" && txStatus === "Pending%2BSubmission") ||
  (merchantData.payment_type === "credit-card" && txStatus === "captured")) {
  return axios.patch(`${process.env.BACK_END_URL}/blink/invoices/${merchantData.invoice_id}`, {
    status: "Paid",
    transaction_id,
    paidDate: createDate()
  }) 
}
}
const { faker } = require('@faker-js/faker');
const generateRandomNumber = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;



const limitMonths = ['', 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dueDate = () => {
  todaysDate = createDate();
  const range = Math.round(generateRandomNumber(1, 10));
  const dateArr = todaysDate.split("-");
  const day = Number(dateArr[0]);
  const month = Number(dateArr[1]);
  const year = Number(dateArr[2]);
  if (day + range < limitMonths[month]) return `${day + range}-${month}-${year}`;
  else if (month < 12) {
    const newDay = day + range - limitMonths[month];
    let newMonth = month + 1;
    if (newMonth < 10) return `${newDay}-0${newMonth}-${year}`;
    else return `${newDay}-0${newMonth}-${year}`;
  } else {
    const newDay = day + range - limitMonths[month];
    const newMonth = "01";
    const newYear = year + 1;
    return `${newDay}-${newMonth}-${newYear}`;
  }
}


const createFakeData = (newDate) => {
  const name = faker.person.fullName();
  const email = faker.internet.email();
  const amount = generateRandomNumber(1.01, 24.99);
  const gbp = { name: "United Kingdom Pound", code: "GBP", symbol: "£" };
  // const usd = { name: "United States Dollar", code: "USD", symbol: "$" };  
  // const euro = { name: "Euro Member Countries", code: "EUR", symbol: "€" };
  // const currency = Math.random() < 0.75 ? gbp : Math.random() < 0.5 ? usd : euro;
  const currency = gbp;
  const status = "Unpaid";
  const id = faker.string.uuid().split("-")[0];
  const dueDate = newDate;

  const newInvoice = {
    id,
    name,
    email,
    amount,
    dueDate,
    status,
    currency
  }
  return newInvoice
}



module.exports = {
  getToken, storeToken,
  checkForUpdate, createDate, dueDate, createFakeData, updateFromNotification
}