# Solidity Smart Contracts

This repository contains several smart contracts I’m working on.

## Contracts

### 1. Vote Contract
The Vote contract implements an election where registered voters can vote during a predefined time period. A voter can only vote once per ballot section and only during the election period.
VoterToken is an ERC-721 NFT contract that doesn’t allow to transfer the ownership once token is minted [soulbound NFT](https://vitalik.ca/general/2022/01/26/soulbound.html). It serves as a voter’s registry.

Unit tests cover 100% lines, functions and branches, but is it really unbreakable?

### 2. VoterToken
VoterToken is an ERC-721 NFT contract that doesn’t allow transferring ownership once the token is minted ([soulbound NFT](https://vitalik.ca/general/2022/01/26/soulbound.html)). It serves as a voter’s registry.

### 3. TimeLock
TimeLock is a multi-signature contract that allows users to submit arbitrary transactions for later consideration by others. Transaction information must include a timestamp at least `MINIMUM_DELAY` in the future and less than `MAXIMUM_DELAY`.

### 4. CommitReveal Contract
The CommitReveal contract implements a commit-reveal voting mechanism.

- **Contract Address**: [0x5F612C7C89dCb8991c6973824399E5BC55B12D2A](https://basescan.org/address/0x5F612C7C89dCb8991c6973824399E5BC55B12D2A#code)
