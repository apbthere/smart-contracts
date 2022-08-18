// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Vote {
    address private owner;
    ERC721 immutable private voterRoll; 
    mapping (string => mapping(string => uint)) private tally;
    mapping (address => mapping (string => bool)) private voted;
    mapping (string => mapping (string => bool)) private ballot;

    struct Choices {
        string section;
        string choice;
    }
    Choices[] private ballotItems;

    mapping (string => string) private winners;

    uint private immutable startTime;
    uint private immutable endTime;

    event Voted(string indexed section, string indexed choice);
    
    constructor(ERC721 _voterRoll, uint _startTime, uint _endTime) {
        require(_startTime < _endTime, "startTime must be before endTime");

        owner = msg.sender;
        voterRoll = _voterRoll;

        startTime = _startTime;
        endTime = _endTime;
     }

    modifier admin() {
        require(owner == msg.sender, "Unathorized");
        _;
    }

    modifier registered() {
        require(voterRoll.balanceOf(msg.sender) > 0, "Not a registered voter");
        _;
    }

    function addChoice(string calldata section, string calldata choice) external admin {
        require(!ballot[section][choice], "Duplicate choice");

        ballot[section][choice] = true;

        ballotItems.push(Choices(section, choice));
    }

    function vote(string calldata section, string calldata choice) external registered {
        require(block.timestamp >= startTime, "Election has not started yet.");
        require(block.timestamp <= endTime, "Election has ended.");

        require(!voted[msg.sender][section], "Already voted");
        require(ballot[section][choice], "Invalid choice");

        tally[section][choice]++;

        voted[msg.sender][section] = true;

        emit Voted(section, choice);

        // is this a new front runner?
        if (tally[section][choice] > tally[section][winners[section]]) {
            winners[section] = choice;
        }
    }

    function getCurrentVotes(string calldata section, string calldata choice) 
    external
    view 
    returns (uint) {
        return tally[section][choice];
    }

    function getWinner(string calldata section) 
    external
    view 
    returns (string memory) {
        return winners[section];
    }
}