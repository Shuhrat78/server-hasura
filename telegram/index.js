

const dotenv = require('dotenv');
dotenv.config();
const fetch = require('node-fetch')
const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
const hgeEndpoint = process.env.GRAPHQL_ENDPOINT + '/v1/graphql';
const bodyParser = require('body-parser');

const TelegramBot = require('node-telegram-bot-api');
const polka = require('polka');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.CHAT_ID;


const orderQuery = `query ($order_id: Int!) {
    orders(where: {id: {_eq: $order_id}}) {
      summ {
        summ
      }
      orders_products {
        quantity
        product {
          price
          product_locales {
            name
          }
        }
      }
      user {
        address {
          name
          phone
          fullname
        }
      }
    }
  }
  
  `

polka()
    .use(bodyParser.json())
    .post('/', (req, res) => {
        console.log(req.body.event.data.new.status)
        console.log(adminSecret)
        if (req.body.event.data.new.status === 3) {
            fetch(hgeEndpoint, {
                method: 'POST',
                body: JSON.stringify({ query: orderQuery, variables: { order_id: req.body.event.data.new.id } }),
                headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
            })
                .then(res => res.json())
                .then(json => {
                    console.log(json)
                    const data = {
                        summ: json.data.orders[0].summ.summ,
                        products: json.data.orders[0].orders_products.map(pr => ({
                            quantity: pr.quantity,
                            name: pr.product.product_locales[0].name,

                        })),
                        user: {
                            address: json.data.orders[0].user.address.name,
                            phone: json.data.orders[0].user.address.phone,
                            fullname: json.data.orders[0].user.address.fullname
                        }
                    }
                    const bot = new TelegramBot(token, { polling: true });
                    let sendData = `<strong>Заказ №</strong> ${req.body.event.data.new.id} Оплачен \n`
                    sendData += `<strong>сумма:${data.summ}</strong>`;
                    data.products.map(pr => {
                        sendData += `
                        <pre>
                        Количество:${pr.quantity}
                        Название:${pr.name}
                        </pre>`;
                    })
                    sendData += `<pre>
                    Адресс:${data.user.address}
                    Телефон:${data.user.phone}
                    Имя:${data.user.fullname}
                    </pre>`;

                    bot.sendMessage(chatId, sendData
                        , { parse_mode: 'HTML' });


                    res.end(`Order: ${req.body.event.data.new.id}`);

                });


        }


    })
    .listen(process.env.PORT, err => {
        if (err) throw err;
        console.log(`> Running on ${process.env.PORT}`);
    });






