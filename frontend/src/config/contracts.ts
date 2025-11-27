export const CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000000' as `0x${string}`; // Replace with deployed address

export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AlreadyRegistered',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PlayerNotRegistered',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZamaProtocolUnsupported',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'euint32', name: 'newEncryptedScore', type: 'bytes32' },
    ],
    name: 'MonsterGuessed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'euint32', name: 'encryptedScore', type: 'bytes32' },
    ],
    name: 'PlayerRegistered',
    type: 'event',
  },
  {
    inputs: [],
    name: 'confidentialProtocolId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEncryptedCorrectChoice',
    outputs: [{ internalType: 'euint8', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGameConfig',
    outputs: [
      { internalType: 'uint32', name: 'startingScore', type: 'uint32' },
      { internalType: 'uint32', name: 'reward', type: 'uint32' },
      { internalType: 'uint32', name: 'penalty', type: 'uint32' },
      { internalType: 'uint8', name: 'totalMonsters', type: 'uint8' },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getLastOutcome',
    outputs: [{ internalType: 'ebool', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getPlayerScore',
    outputs: [{ internalType: 'euint32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getPlayerState',
    outputs: [
      {
        components: [
          { internalType: 'euint32', name: 'encryptedScore', type: 'bytes32' },
          { internalType: 'uint32', name: 'gamesPlayed', type: 'uint32' },
          { internalType: 'bool', name: 'registered', type: 'bool' },
        ],
        internalType: 'struct EncryptedRealityRift.PlayerState',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'externalEuint8', name: 'encryptedMonster', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'guessMonster',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'registerPlayer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
