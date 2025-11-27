import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/GameHeader.css';

type GameHeaderProps = {
  monsterCount: number;
};

export function GameHeader({ monsterCount }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header__text">
        <p className="game-header__kicker">Encrypted Reality Rift</p>
        <h1 className="game-header__title">Battle the Hidden Spirits</h1>
        <p className="game-header__subtitle">
          Four monsters guard the rift. Only the second spirit is aligned with you, but its identity stays encrypted on-chain.
          Pick wisely, earn encrypted points, and decrypt them whenever you dare.
        </p>
        <p className="game-header__meta">
          {monsterCount} guardians • +10 points when correct • -10 points when wrong
        </p>
      </div>
      <ConnectButton label="Connect Wallet" chainStatus="icon" />
    </header>
  );
}
