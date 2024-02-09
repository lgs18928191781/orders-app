const changelog = [
  {
    version: '3.0.0',
    emoji: '🏔️️',
    date: '2024-2-09',
    changes: [
      '🧨🧨🧨 Happy Chinese New Year! 🧨🧨🧨',
      'We are now officially in the 3.0 era! 🎉🎉🎉 What a ride!',
      'Swap module V0 is now enter its testing phase. Users can now swap between BRC20 tokens on BTC Testnet network',
      'Lots of bug fixes',
    ],
  },
  {
    version: '2.1.0',
    emoji: '☄️',
    date: '2024-1-26',
    changes: ['Release full functionality of Orderbook V2.', 'Fix some bugs.'],
  },
  {
    version: '2.0.1',
    emoji: '🌈',
    date: '2024-1-17',
    changes: ['Add Events and Leaderboard module.', 'Fix some bugs.'],
  },
  {
    version: '2.0.0',
    emoji: '🌕',
    date: '2024-1-12',
    changes: [
      'We are now officially in the 2.0 era! 🎉🎉🎉',
      'The orderbook architecture has been completely rewritten, resulting in a much more robust and simpler orderbook system. The system no longer relies on a plp design to function.',
      'Scaffold a brand new AMM-based Swap module (V0). Now in preview mode.',
      'Add a leaderboard page to show the top traders of every BRC20 token.',
      'Add OKX wallet support. Metalet wallet support is on the way.',
      'Numerous usability improvements, bug fixes, and UI polishing.',
    ],
  },
  {
    version: '1.5.1',
    emoji: '🎃',
    date: '2023-12-27',
    changes: [
      'Fix a bug that causes the sell process to fail when the user has multiple UTXOs',
    ],
  },
  {
    version: '1.5.0',
    emoji: '🎅🏻🎄🎅🏻',
    date: '2023-12-25',
    changes: [
      'Merry Christmas!',
      'Refactor the mechanism of sell process. Now use a safer signature type to sign the sell transaction in order to prevent mempool RBF attacks.',
    ],
  },
  {
    version: '1.4.0',
    emoji: '🚤',
    date: '2023-12-21',
    changes: [
      'Refactor the mechanism of liquidity entirely to enhance security',
      'Revamp reward claiming process',
    ],
  },
  {
    version: '1.3.1',
    emoji: '🕺',
    date: '2023-12-05',
    changes: [
      'Users now can claim standby rewards from the liquidities they provide',
    ],
  },
  {
    version: '1.3.0',
    emoji: '🐳',
    date: '2023-12-04',
    changes: [
      'Add Standby Panel to pool page',
      'Allow multiple UTXO Selection (up to 5) when building various operations',
      'Some cleanup and refactoring',
    ],
  },
  {
    version: '1.2.1',
    emoji: '🫶',
    date: '2023-11-25',
    changes: [
      'Improve some incorrect helper texts',
      'Allow multiple UTXO Selection (up to 3) when building 2-way liquidity',
      'Persist liquidity multiplier selection',
      'Some cleanup and refactoring',
    ],
  },
  {
    version: '1.2.0',
    emoji: '⛷️',
    date: '2023-11-24',
    changes: [
      'Add RDEX event panel',
      'Fix a bug that causes incorrect gas fee when releasing liquidity',
      'Use dynamic gas fee algorithm when constructing sell transactions',
      'Asset list panel now shows available assets ratio',
      'Some ui polishing',
    ],
  },
  {
    version: '1.1.1',
    emoji: '👘',
    date: '2023-11-20',
    changes: [
      'Refactor the gas calculation logic on sell process',
      'Separate the assets that have been listed and the assets that can still be listed when displaying assets',
    ],
  },
  {
    version: '1.1.0',
    emoji: '🏊🏻‍♀️',
    date: '2023-11-17',
    changes: [
      'More ui polishing',
      'Fix a bug that causes adding liquidity to has incorrect price',
      'Refactor the logic of liquidity selection',
      'Add more multiplier options for liquidity selection',
      'Add dollar representation for assets',
      'Add BTC/satoshis representation switch for assets',
    ],
  },
  {
    version: '1.0.6',
    emoji: '👻',
    date: '2023-11-15',
    changes: [
      'More ui polishing',
      'Show liquidity use tx in pool release page',
      'Prettify liquidity selection panel in bid page',
      'Show estimated bid miner fee in network state panel',
    ],
  },
  {
    version: '1.0.5',
    emoji: '🍒',
    date: '2023-11-14',
    changes: ['Add a new network status panel to globally set fee rate'],
  },
  {
    version: '1.0.4',
    emoji: '🐛',
    date: '2023-11-13',
    changes: ['Fix some precision issues'],
  },
  {
    version: '1.0.3',
    emoji: '🐛',
    date: '2023-11-13',
    changes: ['Fix a bug that causes taproot address to be unable to use'],
  },
  {
    version: '1.0.2',
    emoji: '📚',
    date: '2023-11-06',
    changes: [
      'Switch to satoshis instead of BTC as the default unit for better precision',
    ],
  },
  {
    version: '1.0.1',
    emoji: '🏄‍♂️',
    date: '2023-11-06',
    changes: ['Do some error message polishing'],
  },
  {
    version: '1.0.0',
    emoji: '🎉',
    date: '2023-10-24',
    changes: [
      'Finally, the first version of Orders.Exchange is released!',
      'Hell yeah!',
    ],
  },
  {
    version: '0.8.0',
    emoji: '🐳',
    date: '2023-10-07',
    changes: [
      'Introduce liquidity pool feature',
      'Add bidirectional liquidity support',
      'Fix various bugs',
    ],
  },
  {
    version: '0.7.0',
    emoji: '🃏',
    date: '2023-09-01',
    changes: [
      '(Almost) Final draft of pool feature',
      'Use a more accurate way to calculate fee',
      'Add taproot support',
    ],
  },
  {
    version: '0.6.2',
    emoji: '🐊',
    date: '2023-08-24',
    changes: [
      'Third draft of pool feature',
      'Finish main workflow of pool feature',
    ],
  },
  {
    version: '0.6.1',
    emoji: '🌊',
    date: '2023-08-03',
    changes: [
      'Second draft of pool feature',
      'Add remove and claim page to pool feature',
      'Build a nicer README page',
    ],
  },
  {
    version: '0.6.0',
    emoji: '🏊‍♂️',
    date: '2023-06-30',
    changes: ['First draft of pool feature'],
  },
  {
    version: '0.5.3',
    emoji: '🤨',
    date: '2023-06-29',
    changes: ['Add changelog'],
  },

  {
    version: '0.5.2',
    emoji: '🎣',
    date: '2023-06-28',
    changes: ['Add a whitelist page', 'Add a header navbar'],
  },
]

export default changelog
