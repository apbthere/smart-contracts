// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CommitReveal is Ownable {
    mapping(address => bytes32) public commits;
    mapping(address => Moves) public votes;
    bool votingStopped;

    event CommitmentMade(bytes32 commitment);
    event Reveal(address indexed addr, Moves indexed move);

    enum Moves {None, Rock, Paper, Scissors}
   
    function commitVote(bytes32 _hashedVote) external {
        require(!votingStopped);
        require(commits[msg.sender] == bytes32(0));

        commits[msg.sender] = _hashedVote;

        emit CommitmentMade(_hashedVote);
    }

    function revealVote(Moves _move, bytes32 _secret) external {
        require(votingStopped);

        bytes32 commit = keccak256(abi.encodePacked(_move, _secret, msg.sender));

        require(commit == commits[msg.sender]);

        delete commits[msg.sender];

        votes[msg.sender] = _move;

        emit Reveal(msg.sender, votes[msg.sender]);
    }
 
    function stopVoting() external onlyOwner {
        require(!votingStopped);
        votingStopped = true;
    }

    function getCommit(address _address) public view returns (bytes32) {
        return commits[_address];
    }
}