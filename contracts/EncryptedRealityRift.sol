// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint32, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedRealityRift
/// @notice Monster selection game that keeps player scores and the winning monster encrypted on-chain.
contract EncryptedRealityRift is ZamaEthereumConfig {
    uint32 private constant STARTING_SCORE = 100;
    uint32 private constant REWARD_POINTS = 10;
    uint32 private constant PENALTY_POINTS = 10;
    uint8 private constant CORRECT_MONSTER_INDEX = 2;
    uint8 private constant MONSTER_COUNT = 4;

    struct PlayerState {
        euint32 encryptedScore;
        uint32 gamesPlayed;
        bool registered;
    }

    euint8 private _encryptedCorrectChoice;
    mapping(address => PlayerState) private _playerStates;
    mapping(address => ebool) private _lastGuessOutcome;

    event PlayerRegistered(address indexed player, euint32 encryptedScore);
    event MonsterGuessed(address indexed player, euint32 newEncryptedScore);

    error AlreadyRegistered();
    error PlayerNotRegistered();

    constructor() {
        _encryptedCorrectChoice = FHE.asEuint8(CORRECT_MONSTER_INDEX);
        FHE.allowThis(_encryptedCorrectChoice);
    }

    /// @notice Registers a new player with an encrypted balance of 100 points.
    function registerPlayer() external {
        PlayerState storage player = _playerStates[msg.sender];
        if (player.registered) {
            revert AlreadyRegistered();
        }

        euint32 startingScore = FHE.asEuint32(STARTING_SCORE);
        player.encryptedScore = startingScore;
        player.gamesPlayed = 0;
        player.registered = true;

        FHE.allowThis(player.encryptedScore);
        FHE.allow(player.encryptedScore, msg.sender);

        emit PlayerRegistered(msg.sender, player.encryptedScore);
    }

    /// @notice Submits an encrypted monster selection and updates the player's encrypted score.
    /// @param encryptedMonster Number between 1 and 4 that represents the selected monster.
    /// @param inputProof Relayer proof for the encrypted value.
    function guessMonster(externalEuint8 encryptedMonster, bytes calldata inputProof) external {
        PlayerState storage player = _playerStates[msg.sender];
        if (!player.registered) {
            revert PlayerNotRegistered();
        }

        euint8 playerChoice = FHE.fromExternal(encryptedMonster, inputProof);
        ebool isCorrect = FHE.eq(playerChoice, _encryptedCorrectChoice);

        euint32 reward = FHE.asEuint32(REWARD_POINTS);
        euint32 penalty = FHE.asEuint32(PENALTY_POINTS);
        euint32 zeroScore = FHE.asEuint32(0);

        euint32 increasedScore = FHE.add(player.encryptedScore, reward);
        euint32 decreasedScore = FHE.sub(player.encryptedScore, penalty);
        ebool hasEnoughForPenalty = FHE.ge(player.encryptedScore, penalty);
        euint32 safeDecrease = FHE.select(hasEnoughForPenalty, decreasedScore, zeroScore);
        euint32 updatedScore = FHE.select(isCorrect, increasedScore, safeDecrease);

        player.encryptedScore = updatedScore;
        player.gamesPlayed += 1;

        FHE.allowThis(updatedScore);
        FHE.allow(updatedScore, msg.sender);

        _lastGuessOutcome[msg.sender] = isCorrect;
        FHE.allowThis(isCorrect);
        FHE.allow(isCorrect, msg.sender);

        emit MonsterGuessed(msg.sender, player.encryptedScore);
    }

    /// @notice Returns the encrypted score stored for a player.
    /// @param player Address of the player.
    function getPlayerScore(address player) external view returns (euint32) {
        return _playerStates[player].encryptedScore;
    }

    /// @notice Returns the stored state for a player.
    /// @param player Address of the player.
    function getPlayerState(address player) external view returns (PlayerState memory) {
        return _playerStates[player];
    }

    /// @notice Returns the encrypted outcome of the player's last guess.
    /// @param player Address of the player that guessed.
    function getLastOutcome(address player) external view returns (ebool) {
        return _lastGuessOutcome[player];
    }

    /// @notice Returns the global game configuration.
    function getGameConfig()
        external
        pure
        returns (uint32 startingScore, uint32 reward, uint32 penalty, uint8 totalMonsters)
    {
        return (STARTING_SCORE, REWARD_POINTS, PENALTY_POINTS, MONSTER_COUNT);
    }

    /// @notice Returns the encrypted correct monster index.
    function getEncryptedCorrectChoice() external view returns (euint8) {
        return _encryptedCorrectChoice;
    }
}
