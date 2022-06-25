/**
 * Данные со 2 июня 2017, когда цена BTC была 1031 USDT.
 * По 25 июня 2022
 */
const data = require('./data.json');

const dataset = data.Data.Data.map((e) => [e.low, e.high]).flat();

/**
  *
  */

const config = {
  buyThreshold: 50,
  sellThreshold: 200,
  transactionVolume: 30,
  initBtcBalance: 2,
  initUsdtBalance: 0,
};

let btcBalance = config.initBtcBalance;
let usdtBalance = config.initUsdtBalance;

let prevHighestReference = dataset[0];
let prevLowestReference = dataset[0];

const transactions = [
  {
    amount: 0,
    type: 'INIT',
    usdtPart: 0,
    btcPart: 200,
  },
];

let networth = 0;
let nwDetails = 0;

for (const dataIndex in dataset) {
  const price = dataset[dataIndex];
  const lastTransaction = transactions[transactions.length - 1];

  const positivePriceChange = (price / prevLowestReference) * 100;
  const negativePriceChange = (price / prevHighestReference) * 100;

  const nextNw = usdtBalance + (btcBalance * price);
  if (nextNw > networth) {
    networth = nextNw;
    nwDetails = {
      usdtBalance,
      btcBalance,
      price,
      date: new Date(data.Data.Data[Math.round(dataIndex / 2)].time * 1000),
    };
  }

  if (positivePriceChange > config.sellThreshold) {
    const amount = Math.min(((networth * config.transactionVolume) / price) / 100, btcBalance);

    if (amount > 0) {
      btcBalance -= amount;
      usdtBalance += amount * price;

      const transaction = {
        amount,
        type: 'BTC to USDT',
        usdtPart: lastTransaction.usdtPart + config.transactionVolume,
        btcPart: lastTransaction.btcPart - config.transactionVolume,
        btcBalance,
        usdtBalance,
        price,
        positivePriceChange,
        prevLowestReference,
        dataIndex,
        networth: usdtBalance + (btcBalance * price),
      };
      transactions.push(transaction);
    }

    prevLowestReference = price;
  }

  if (negativePriceChange <= config.buyThreshold) {
    prevHighestReference = price;

    const amount = Math.min((networth * config.transactionVolume) / 100, usdtBalance);

    if (amount > 0) {
      usdtBalance -= amount;
      btcBalance += amount / price;

      const transaction = {
        amount,
        type: 'USDT to BTC',
        usdtPart: lastTransaction.usdtPart - config.transactionVolume,
        btcPart: lastTransaction.btcPart + config.transactionVolume,
        btcBalance,
        usdtBalance,
        price,
        negativePriceChange,
        dataIndex,
        networth: usdtBalance + (btcBalance * price),
      };

      transactions.push(transaction);
    }
  }

  prevLowestReference = Math.min(prevLowestReference, price);
  prevHighestReference = Math.max(prevHighestReference, price);
}

console.log(transactions);
console.log('TX length:', transactions.length);
console.log('Max Networth:', networth, nwDetails);
