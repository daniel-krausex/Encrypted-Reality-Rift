# Encrypted Reality Rift

Encrypted Reality Rift is a fully homomorphic encryption (FHE) powered guessing game. Players register on-chain, receive 100 encrypted points, and challenge four monsters. Only the second spirit is correct; a right guess adds 10 encrypted points, a wrong one subtracts 10 (never dropping below zero). Scores, guesses, and outcomes remain encrypted end-to-end through Zama's FHEVM stack while still benefiting from on-chain verifiability.

## Why It Matters
- Preserves player privacy: monster picks, scores, and outcomes stay encrypted on-chain.
- Verifiable fairness: scoring logic is deterministic and encoded in the contract; anyone can audit the rules without seeing private values.
- Secure UX: the frontend encrypts guesses client-side, relays them through Zama's SDK, and decrypts results only with explicit user authorization.
- Balanced gameplay: rewards and penalties are capped to prevent negative balances while tracking rounds played.
- Ready for real networks: designed for Sepolia with private-key deployments and relayer integration; no localhost or mocked data in the UI.

## Game Flow
- Register: wallet signs a transaction to mint an encrypted starting score of 100 and grants decryption rights to the player and contract.
- Guess: pick one of four monsters; the choice is encrypted locally and submitted with a relayer proof.
- Score update: contract compares the encrypted guess to the encrypted correct answer, adds or subtracts 10 points, and clamps at zero.
- Decrypt: player authorizes a Zama decrypt request to reveal their latest score and whether the last guess was correct.

## Tech Stack
- Smart contracts: Solidity 0.8.27, Hardhat + hardhat-deploy, TypeChain (ethers v6), Zama FHEVM Solidity library.
- Encryption: @fhevm/hardhat-plugin for tests, @zama-fhe/relayer-sdk for frontend encryption/decryption.
- Frontend: React + Vite, RainbowKit for wallet UX, wagmi/viem for reads, ethers for writes, custom CSS (no Tailwind).
- Tooling: ESLint, Prettier, Solidity coverage and gas reporting.

## Repository Map
- `contracts/EncryptedRealityRift.sol` - core FHE game contract with encrypted scoring.
- `deploy/deploy.ts` - hardhat-deploy script for local and Sepolia networks.
- `deployments/sepolia/EncryptedRealityRift.json` - generated ABI and deployed address source for the frontend.
- `tasks/` - Hardhat tasks for registering, guessing, and decrypting scores/outcomes.
- `test/` - unit tests for the mock FHE environment and Sepolia integration checks.
- `frontend/` - Vite + React app; uses viem for reads and ethers for writes; integrates the Zama relayer SDK.
- `docs/` - reference notes for Zama FHE contracts and relayer usage.

## Smart Contract Design
- Encrypted state: stores the correct monster index (2), each player's encrypted score, games played, and last guess outcome.
- Scoring rules: +10 for correct guesses, -10 for incorrect guesses, never below zero, all computed with encrypted arithmetic.
- Access control: encrypted values allow the contract and the player to decrypt; view functions avoid `msg.sender`-based logic.
- Interfaces: `getPlayerState`, `getPlayerScore`, `getLastOutcome`, `getGameConfig`, `getEncryptedCorrectChoice`, plus events for registration and guesses.

## Frontend Experience
- Wallet onboarding with RainbowKit; fixed to Sepolia (no localhost).
- Encrypted gameplay loop: user encrypts guesses with the relayer SDK before sending transactions.
- Reads via viem/public client; writes via ethers signer (register and guess).
- Decryption UX: requests a temporary keypair and typed-data signature to decrypt both score and last outcome.
- Configuration in code (no frontend `.env`): contract address and ABI live in `frontend/src/config/contracts.ts`; WalletConnect project id in `frontend/src/config/wagmi.ts`.

## Getting Started (Contracts)
1. Prerequisites: Node.js 20+, npm.
2. Install dependencies at the repo root:
   ```bash
   npm install
   ```
3. Environment variables (root `.env`, private key only; no mnemonic):
   ```
   PRIVATE_KEY=0xYourPrivateKey
   INFURA_API_KEY=YourInfuraKey
   ETHERSCAN_API_KEY=OptionalForVerification
   ```
4. Compile and test (mock FHE on Hardhat):
   ```bash
   npm run compile
   npm run test
   ```
5. Local node + deploy:
   ```bash
   npm run chain            # starts Hardhat node
   npm run deploy:localhost # deploys EncryptedRealityRift locally
   ```
6. Sepolia deploy and verify (uses `PRIVATE_KEY` and `INFURA_API_KEY`):
   ```bash
   npm run deploy:sepolia
   npm run verify:sepolia -- <DEPLOYED_ADDRESS>
   ```
7. Useful Hardhat tasks:
   - `npx hardhat task:rift-address --network sepolia`
   - `npx hardhat task:register-player --network sepolia`
   - `npx hardhat task:guess-monster --choice 2 --network sepolia`
   - `npx hardhat task:decrypt-score --network sepolia`
   - `npx hardhat task:decrypt-outcome --network sepolia`

## Getting Started (Frontend)
1. Install frontend deps:
   ```bash
   cd frontend
   npm install
   ```
2. Configure wallet and contracts in code:
   - Set `projectId` in `frontend/src/config/wagmi.ts` (WalletConnect Cloud id).
   - Set `CONTRACT_ADDRESS` and paste the ABI from `deployments/sepolia/EncryptedRealityRift.json` into `frontend/src/config/contracts.ts`.
3. Run the UI:
   ```bash
   npm run dev
   ```
   The app targets Sepolia; ensure the connected wallet is on Sepolia and the contract is deployed there.

## Problems Solved
- On-chain games without leakage: encrypted storage keeps scores and choices private while remaining blockchain-verifiable.
- Trust-minimized scoring: rewards and penalties are enforced in the contract with FHE arithmetic instead of off-chain bookkeeping.
- User-controlled decryption: players authorize when and what to decrypt, reducing exposure risk.
- Developer ergonomics: Hardhat tasks, TypeChain typings, and relayer-ready frontend hooks speed up iteration.

## Future Roadmap
- Dynamic monster rotations and variable rewards/penalties.
- Encrypted leaderboards with opt-in reveal policies.
- Session-based tournaments and streak bonuses encoded with FHE.
- Multi-network support once additional FHE-enabled chains are available.
- Expanded observability: richer status/error reporting from the relayer and contract events in the UI.

## Reference Docs
- Contract FHE guide: `docs/zama_llm.md`
- Frontend relayer integration: `docs/zama_doc_relayer.md`
