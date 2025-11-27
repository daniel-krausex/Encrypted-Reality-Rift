import '../styles/MonsterGrid.css';

export type MonsterInfo = {
  id: number;
  name: string;
  title: string;
  description: string;
  aura: string;
};

type MonsterGridProps = {
  monsters: MonsterInfo[];
  disabled: boolean;
  disabledReason: string | null;
  activeMonster: number | null;
  onGuess: (monsterId: number) => void;
};

export function MonsterGrid({ monsters, disabled, disabledReason, activeMonster, onGuess }: MonsterGridProps) {
  return (
    <section className="monster-section">
      <div className="monster-section__header">
        <div>
          <p className="monster-section__kicker">Choose your monster</p>
          <h2 className="monster-section__title">Meet the guardians of the rift</h2>
          <p className="monster-section__subtitle">
            Your selection is encrypted before it touches the blockchain. If the hidden beast matches your choice, encrypted
            points surge in your favor.
          </p>
        </div>
        {disabledReason && <p className="monster-section__status">{disabledReason}</p>}
      </div>
      <div className="monster-grid">
        {monsters.map(monster => (
          <article key={monster.id} className={`monster-card monster-card--${monster.aura}`}>
            <div className="monster-card__badge">#{monster.id}</div>
            <h3 className="monster-card__name">{monster.name}</h3>
            <p className="monster-card__title">{monster.title}</p>
            <p className="monster-card__description">{monster.description}</p>
            <button
              className="monster-card__action"
              disabled={disabled || activeMonster === monster.id}
              onClick={() => onGuess(monster.id)}
            >
              {activeMonster === monster.id ? 'Sending encrypted guess...' : 'Challenge this spirit'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
