import { useState, useMemo, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useQuery } from '@tanstack/react-query';
import { Contract } from 'ethers';

import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { GameHeader } from './GameHeader';
import { MonsterGrid } from './MonsterGrid';
import type { MonsterInfo } from './MonsterGrid';
import { ScorePanel } from './ScorePanel';

import '../styles/GameLayout.css';

const TOTAL_MONSTERS = 4;
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

type PlayerStateTuple = readonly [`0x${string}`, bigint, boolean];

type PlayerSnapshot = {
  encryptedScore: `0x${string}`;
  gamesPlayed: number;
  registered: boolean;
  lastOutcome: `0x${string}`;
};

const MONSTERS: MonsterInfo[] = [
  {
    id: 1,
    name: 'Ashen Wraith',
    title: 'Keeper of embers',
    description: 'Burns through illusions with molten feathers. Whispers hints that lure challengers off course.',
    aura: 'ember',
  },
  {
    id: 2,
    name: 'Serene Myriad',
    title: 'Veiled harmony',
    description: 'The lone ally hidden indoors. Grants ten encrypted points to players who sense its calm rhythm.',
    aura: 'aqua',
  },
  {
    id: 3,
    name: 'Null Gazer',
    title: 'Eater of echoes',
    description: 'Consumes all noise surrounding the rift. Wrong guesses feed its appetite for secret data.',
    aura: 'violet',
  },
  {
    id: 4,
    name: 'Stone Choir',
    title: 'March of giants',
    description: 'Four granite masks chant in unison, daring you to select a false avatar and lose encrypted points.',
    aura: 'jade',
  },
];

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function RiftGameApp() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const signer = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [registerPending, setRegisterPending] = useState(false);
  const [decryptPending, setDecryptPending] = useState(false);
  const [activeMonster, setActiveMonster] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [decryptedScore, setDecryptedScore] = useState<number | null>(null);
  const [decryptedOutcome, setDecryptedOutcome] = useState<string | null>(null);

  const zamaReady = Boolean(instance) && !zamaLoading;

  const { data: playerSnapshot, refetch: refetchPlayerSnapshot } = useQuery<PlayerSnapshot | null>({
    queryKey: ['player-state', address],
    queryFn: async () => {
      if (!publicClient || !address) {
        return null;
      }

      const state = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getPlayerState',
        args: [address as `0x${string}`],
      })) as unknown as PlayerStateTuple;

      const lastOutcome = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getLastOutcome',
        args: [address as `0x${string}`],
      })) as `0x${string}`;

      return {
        encryptedScore: state[0],
        gamesPlayed: Number(state[1]),
        registered: state[2],
        lastOutcome,
      };
    },
    enabled: Boolean(address && publicClient),
    refetchInterval: 12000,
  });

  const encryptedScore = playerSnapshot?.encryptedScore ?? (ZERO_BYTES32 as `0x${string}`);
  const gamesPlayed = playerSnapshot?.gamesPlayed ?? 0;
  const registered = playerSnapshot?.registered ?? false;
  const lastOutcome = playerSnapshot?.lastOutcome ?? (ZERO_BYTES32 as `0x${string}`);

  const disabledReason = useMemo(() => {
    if (!isConnected) {
      return 'Connect a wallet to join the game.';
    }
    if (!registered) {
      return 'Register to unlock the monster challenge.';
    }
    if (!zamaReady) {
      return 'Waiting for the encryption relayer.';
    }
    return null;
  }, [isConnected, registered, zamaReady]);

  const handleRegister = useCallback(async () => {
    if (!isConnected) {
      setStatusMessage('Please connect your wallet first.');
      return;
    }

    setRegisterPending(true);
    setStatusMessage('Sending registration transaction...');

    try {
      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer not available.');
      }

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner);
      const tx = await contract.registerPlayer();
      await tx.wait();

      setStatusMessage('Registration confirmed! Ready to battle.');
      await refetchPlayerSnapshot();
    } catch (error) {
      setStatusMessage(extractErrorMessage(error));
    } finally {
      setRegisterPending(false);
    }
  }, [isConnected, refetchPlayerSnapshot, signer]);

  const handleMonsterGuess = useCallback(
    async (monsterId: number) => {
      if (!isConnected) {
        setStatusMessage('Connect your wallet to challenge a monster.');
        return;
      }
      if (!registered) {
        setStatusMessage('Register first to receive your encrypted score.');
        return;
      }
      if (!instance) {
        setStatusMessage('Encryption service not ready yet.');
        return;
      }

      setActiveMonster(monsterId);
      setStatusMessage('Encrypting your selection...');

      try {
        const payload = instance.createEncryptedInput(CONTRACT_ADDRESS, address!);
        payload.add8(monsterId);
        const encryptedInput = await payload.encrypt();

        const resolvedSigner = await signer;
        if (!resolvedSigner) {
          throw new Error('Wallet signer not available.');
        }

        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner);
        const tx = await contract.guessMonster(encryptedInput.handles[0], encryptedInput.inputProof);
        setStatusMessage('Waiting for confirmation on-chain...');
        await tx.wait();

        setStatusMessage('Guess confirmed! Decrypt to see your updated score.');
        await refetchPlayerSnapshot();
      } catch (error) {
        setStatusMessage(extractErrorMessage(error));
      } finally {
        setActiveMonster(null);
      }
    },
    [address, instance, isConnected, refetchPlayerSnapshot, registered, signer],
  );

  const handleDecrypt = useCallback(async () => {
    if (!isConnected || !address) {
      setStatusMessage('Connect your wallet to decrypt.');
      return;
    }

    if (!instance) {
      setStatusMessage('Encryption service not ready.');
      return;
    }

    if (!playerSnapshot || encryptedScore === ZERO_BYTES32) {
      setStatusMessage('No encrypted score available yet.');
      return;
    }

    setDecryptPending(true);
    setStatusMessage('Authorizing a decryption request...');

    try {
      const keypair = instance.generateKeypair();
      const handles = [encryptedScore];
      if (lastOutcome !== ZERO_BYTES32) {
        handles.push(lastOutcome);
      }

      const handleContractPairs = handles.map(handle => ({
        handle,
        contractAddress: CONTRACT_ADDRESS,
      }));

      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer not available.');
      }

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const decrypted = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      const scoreValueRaw = decrypted[encryptedScore];
      const numericScore =
        typeof scoreValueRaw === 'string' ? Number(scoreValueRaw) : Number(scoreValueRaw ?? 0);
      const scoreValue = Number.isNaN(numericScore) ? null : numericScore;

      let outcomeLabel: string | null = null;
      if (lastOutcome !== ZERO_BYTES32) {
        const outcomeValueRaw = decrypted[lastOutcome];
        const normalized = typeof outcomeValueRaw === 'string' ? Number(outcomeValueRaw) : Number(outcomeValueRaw || 0);
        if (!Number.isNaN(normalized)) {
          outcomeLabel = normalized === 1 ? 'Victory! You picked the correct monster.' : 'Defeat. Ten points were deducted.';
        }
      }

      setDecryptedScore(scoreValue);
      setDecryptedOutcome(outcomeLabel);
      setStatusMessage('Decryption complete. Score synced locally.');
    } catch (error) {
      setStatusMessage(extractErrorMessage(error));
    } finally {
      setDecryptPending(false);
    }
  }, [address, encryptedScore, instance, isConnected, lastOutcome, playerSnapshot, signer]);

  return (
    <div className="rift-layout">
      <GameHeader monsterCount={TOTAL_MONSTERS} />
      <ScorePanel
        encryptedScore={encryptedScore}
        gamesPlayed={gamesPlayed}
        registered={registered}
        isConnected={isConnected}
        zamaReady={zamaReady}
        zamaLoading={zamaLoading}
        zamaError={zamaError}
        onRegister={handleRegister}
        onDecrypt={handleDecrypt}
        registerPending={registerPending}
        decryptPending={decryptPending}
        decryptedScore={decryptedScore}
        decryptedOutcome={decryptedOutcome}
        statusMessage={statusMessage}
      />
      <MonsterGrid
        monsters={MONSTERS}
        disabled={!isConnected || !registered || !zamaReady}
        disabledReason={disabledReason}
        activeMonster={activeMonster}
        onGuess={handleMonsterGuess}
      />
    </div>
  );
}
