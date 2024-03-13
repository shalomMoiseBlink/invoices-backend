const fs = require("fs");
const axios = require("axios");
exports.getToken = ()=>{
  try {
    const data = fs.readFileSync('./storage/token.json', 'utf8');
    return JSON.parse(data)
  } catch (err) {
    console.error(err);
  }
}

exports.storeToken =(token)=>{
  const {access_token} = token.token
      const content = access_token
      fs.writeFile('./storage/token.json', content, err => {
          if (err) {
            console.error(err);
          }
          // file written successfully
        });
  }
  

exports.checkForUpdate =(url)=>{
    if(url){
        const responObj ={};
        url.split("?")[1].split("&").map((datum)=>{
            const [key, value] = datum.split("=");
            return {[key]: value}
        }).forEach((item)=>{
            // const [name,value] = Object.entries(item).split(",");
            // responObj[name] = valu
              const key = Object.keys(item)[0];
    
            responObj[key] = item[key]
        })
        if(responObj.merchant_data){
           
          const merchantData =  JSON.parse(decodeURIComponent(decodeURIComponent(responObj.merchant_data)));
          if(responObj.status === "captured") {
             return axios.patch(`http://localhost:9000/blink/invoices/${merchantData.invoice_id}`, {
                status: "Paid"
             })
          }
        }    return '';   

       
 
    }
}

const { faker } = require('@faker-js/faker');
const generateRandomNumber = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;


const createDate= ()=>{
    const currentDate =  new Date();

    // Extract day, month, and year
    const day = currentDate.getDate().toString().padStart(2, '0'); // Ensure 2 digits with leading zero if needed
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed, so add 1
    const year = currentDate.getFullYear();
    
    // Combine into the desired format
    const formattedDate = `${day}-${month}-${year}`;
    
  return formattedDate;
}
const limitMonths = ['', 31,28,31,30,31,30,31,31,30,31,30,31];
const dueDate = ()=>{
    todaysDate = createDate();
    const range = Math.round(generateRandomNumber(1,10));
    const dateArr = todaysDate.split("-");
    const day = Number(dateArr[0]);
    const month = Number(dateArr[1]);
    const year = Number(dateArr[2]);
    if (day+ range < limitMonths[month]) return `${day+range}-${month}-${year}`;
    else if(month < 12) {
        const newDay = day+range - limitMonths[month];
        let newMonth = month + 1;
        if (newMonth < 10) return `${newDay}-0${newMonth}-${year}`;
        else return `${newDay}-0${newMonth}-${year}`;
    }  else {
        const newDay = day+range - limitMonths[month];
        const newMonth = "01";
        const newYear = year + 1;
        return `${newDay}-${newMonth}-${newYear}`;
    }
}


const createFakeData =()=>{
    const randomName = faker.person.fullName(); // Rowan Nikolaus
const randomEmail = faker.internet.email(); // Kassandra.Haley@erich.biz
console.log(randomEmail, randomName);

const randomNumber = generateRandomNumber(1.01, 24.99);
console.log(randomNumber);
const currency = faker.finance.currency()
console.log(currency)
console.log(dueDate())
const status = "Unpaid"



}

createFakeData()