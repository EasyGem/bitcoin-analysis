/**
 * Данные со 2 июня 2017, когда цена BTC была 1031 USDT.
 * По 25 июня 2022
 */
const data = require('./data.json');

const dataset = data.Data.Data.map((e) => [e.low, e.high]).flat();

/**
 *
 * buyThreshold — при при каком падении покупать (50% — падение в два раза)
 * sellThreshold — при каком увеличении продавать (200% — рост в два раза)
 * transactionVolume — какую часть кошелька отправлять на одну транзакцию
 * initBtcBalance — изначальный баланс btc
 * initUsdtBalance — изначальнйы баланс usdt
 * useCredit — использовать ли кредит (баланс будет опускаться ниже нуля)
 */
const configExample = {
  buyThreshold: 50,
  sellThreshold: 200,
  transactionVolume: 25,
  initBtcBalance: 1,
  initUsdtBalance: 0,
  useCredit: true,
};

const buyThresholds = Array(10).fill(null).map((e, i) => (i + 3) * 5);
const sellThreshold = Array(10).fill(null).map((e, i) => 100 + (i + 3) * 10);
const transactionVolumes = Array(5).fill(null).map((e, i) => (i + 3) * 5);

const configMatrix = buyThresholds.map((l1) => sellThreshold.map((l2) => transactionVolumes
  .map((l3) => ({
    buyThreshold: l1,
    sellThreshold: l2,
    transactionVolume: l3,
    initBtcBalance: 1,
    initUsdtBalance: 0,
    useCredit: true,
  })))).flat(2);

// console.log(configMatrix);

const calc = (config) => {
  let btcBalance = config.initBtcBalance;
  let usdtBalance = config.initUsdtBalance;

  let prevHighestReference = dataset[0];
  let prevLowestReference = dataset[0];

  const transactions = [
    {
      amount: 0,
      type: 'INIT',
    },
  ];

  let maxNetworth = 0;
  let minNetworth = Infinity;

  for (const dataIndex in dataset) {
    const price = dataset[dataIndex];

    const positivePriceChange = (price / prevLowestReference) * 100;
    const negativePriceChange = (price / prevHighestReference) * 100;

    const networth = usdtBalance + (btcBalance * price);

    maxNetworth = Math.max(networth, maxNetworth);
    minNetworth = Math.min(networth, minNetworth);

    if (positivePriceChange > config.sellThreshold) {
      const amount = ((networth * config.transactionVolume) / price) / 100;

      if (config.useCredit || amount <= btcBalance) {
        btcBalance -= amount;
        usdtBalance += amount * price;

        const transaction = {
          amount,
          type: 'BTC to USDT',
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

      const amount = (networth * config.transactionVolume) / 100;

      if (config.useCredit || amount <= usdtBalance) {
        usdtBalance -= amount;
        btcBalance += amount / price;

        const transaction = {
          amount,
          type: 'USDT to BTC',
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

  // console.log(transactions);
  // console.log('Transactions amount:', transactions.length);
  // console.log('Max Networth:', maxNetworth);
  // console.log('Min Networth:', minNetworth);
  // console.log('Final Networth:', transactions[transactions.length - 1].networth);

  return {
    txlength: transactions.length,
    maxNetworth,
    minNetworth,
    networth: transactions[transactions.length - 1].networth,
  };
};

const WANNA_FIND_BEST = false; // Если хочешь перебрать все варианты и найти лучший

if (WANNA_FIND_BEST) {
  const results = configMatrix.map((config) => ({ config, result: calc(config) }));

  console.log(results);

  const maxIx = results.reduce((acc, v, i) => (
    results[acc].result.networth > v.result.networth ? acc : i
  ), 0);

  console.log('max', results[maxIx]);
} else {
  // Иначе — запустится один вариант, вот этот
  console.log(calc({
    buyThreshold: 50,
    sellThreshold: 200,
    transactionVolume: 20,
    initBtcBalance: 1,
    initUsdtBalance: 0,
    useCredit: true,
  }));
}
