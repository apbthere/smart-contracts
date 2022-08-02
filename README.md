# Solidity Smart Contracts

This repository contains several smart contracts I’m working on.

Vote contract implements an election where registered voters can vote during the predefined time period. A voter can only vote once per ballot section and only during the election period.

VoterToken is an ERC-721 NFT contract that doesn’t allow to transfer the ownership once token is minted [soulbound NFT](https://vitalik.ca/general/2022/01/26/soulbound.html). It serves as a voter’s registry.

Unit tests cover 100% lines, functions and branches, but is it really unbreakable?

TimeLock is a multi-signature contract that allows users to submit arbitrary transactions for later consideration by others. Transaction information must include timestamp at least MINIMUM_DELAY in the future and less then MAXIMUM_DELAY. 