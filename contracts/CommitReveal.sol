// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CommitReveal is Ownable {
    mapping(address => bytes32) public commits;
    mapping(address => Moves) public votes;
    bool votingStopped;

    event CommitmentMade(bytes32 commitment);
    event Reveal(address indexed addr, Moves indexed move);

    enum Moves {None, Rock, Paper, Scissors}
   
    function commitVote(bytes32 hashedVote) external {
        require(!votingStopped);
        require(commits[msg.sender] == bytes32(0));

        commits[msg.sender] = hashedVote;

        emit CommitmentMade(hashedVote);
    }

    function revealVote(Moves move, bytes32 secret) external {
        require(votingStopped);

        bytes32 commit = keccak256(abi.encodePacked(move, secret, msg.sender));

        require(commit == commits[msg.sender]);

        delete commits[msg.sender];

        votes[msg.sender] = move;

        emit Reveal(msg.sender, votes[msg.sender]);
    }
 
    function stopVoting() external onlyOwner {
        require(!votingStopped);
        votingStopped = true;
    }

    function getCommit(address voterAddress) public view returns (bytes32) {
        return commits[voterAddress];
    }
}