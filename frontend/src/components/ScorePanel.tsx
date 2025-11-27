import '../styles/ScorePanel.css';

type ScorePanelProps = {
  encryptedScore: `0x${string}` | null;
  gamesPlayed: number;
  registered: boolean;
  isConnected: boolean;
  zamaReady: boolean;
  zamaLoading: boolean;
  zamaError: string | null;
  onRegister: () => void;
  onDecrypt: () => void;
  registerPending: boolean;
  decryptPending: boolean;
  decryptedScore: number | null;
  decryptedOutcome: string | null;
  statusMessage: string | null;
};

export function ScorePanel({
  encryptedScore,
  gamesPlayed,
  registered,
  isConnected,
  zamaReady,
  zamaLoading,
  zamaError,
  onRegister,
  onDecrypt,
  registerPending,
  decryptPending,
  decryptedScore,
  decryptedOutcome,
  statusMessage,
}: ScorePanelProps) {
  return (
    <section className="score-panel">
      <div className="score-panel__header">
        <div>
          <p className="score-panel__kicker">Encrypted progress</p>
          <h2 className="score-panel__title">Your Rift dossier</h2>
          <p className="score-panel__subtitle">
            Every player starts with 100 encrypted points. Victories add ten, defeats remove ten, and the ciphertext stays private
            until you authorize a decryption through the Zama Relayer.
          </p>
        </div>
        <div className="score-panel__status">
          <span className={`score-panel__dot ${zamaReady ? 'score-panel__dot--ready' : ''}`} />
          {zamaLoading ? 'Configuring encryption relayer…' : zamaReady ? 'Encryption relayer ready' : 'Relayer unavailable'}
        </div>
      </div>

      {zamaError && <div className="score-panel__alert">Encryption error: {zamaError}</div>}

      <div className="score-panel__grid">
        <div className="score-panel__card">
          <p className="score-panel__label">Encrypted score</p>
          <p className="score-panel__cipher">{encryptedScore ?? '0x00'}</p>
          <p className="score-panel__hint">Share or decrypt this with caution — it represents your hidden balance.</p>
        </div>

        <div className="score-panel__card">
          <p className="score-panel__label">Rounds played</p>
          <p className="score-panel__value">{gamesPlayed}</p>
          <p className="score-panel__hint">{registered ? 'Keep pushing deeper into the rift.' : 'Register to begin.'}</p>
        </div>

        <div className="score-panel__actions">
          {!isConnected && (
            <p className="score-panel__hint">Connect your wallet to register, encrypt guesses, and decrypt your points.</p>
          )}

          {isConnected && !registered && (
            <button className="score-panel__primary" onClick={onRegister} disabled={registerPending}>
              {registerPending ? 'Registering...' : 'Register and receive 100 encrypted points'}
            </button>
          )}

          {isConnected && registered && (
            <button className="score-panel__secondary" onClick={onDecrypt} disabled={decryptPending || !zamaReady}>
              {decryptPending ? 'Decrypting score...' : 'Decrypt my encrypted score'}
            </button>
          )}

          {decryptedScore !== null && (
            <div className="score-panel__decrypted">
              <p className="score-panel__label">Latest decrypted score</p>
              <p className="score-panel__value score-panel__value--highlight">{decryptedScore}</p>
              {decryptedOutcome && <p className="score-panel__hint">{decryptedOutcome}</p>}
            </div>
          )}

          {statusMessage && <p className="score-panel__statusline">{statusMessage}</p>}
        </div>
      </div>
    </section>
  );
}
