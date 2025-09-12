
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract TimeLock {
    uint internal constant MINIMUM_DELAY = 10;
    uint internal constant MAXIMUM_DELAY = 1 days;
    uint internal constant GRACE_PERIOD = 1 days;
    address[] public owners;
    mapping(address => bool) public isOwner;
    string public message;
    uint public amount;
    uint public constant CONFIRMATIONS_REQUIRED = 3;

    struct Transaction {
        bytes32 uid;
        bool executed;
        uint confirmations;
    }
    mapping(bytes32 => Transaction) public txs;

    mapping(bytes32 => mapping(address => bool)) public confirmations;

    mapping(bytes32 => bool) public queue;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner!");
        _;
    }

    event Queued(bytes32 txId);
    event Discarded(bytes32 txId);
    event Executed(bytes32 txId);

    constructor(address[] memory _owners) {
        require(_owners.length >= CONFIRMATIONS_REQUIRED, "Not enough owners!");

        for(uint i = 0; i < _owners.length; i++) {
            address nextOwner = _owners[i];

            require(nextOwner != address(0), "Can't have zero address as owner!");
            require(!isOwner[nextOwner], "Duplicate owner!");

            isOwner[nextOwner] = true;
            owners.push(nextOwner);
        }
    }

    function demo(string calldata inputMsg) external payable {
        message = inputMsg;
        amount = msg.value;
    }

    function addToQueue(
        address to,
        string calldata funcName,
        bytes calldata data,
        uint value,
        uint timestamp
    ) external onlyOwner returns(bytes32) {
        require(
            timestamp > block.timestamp + MINIMUM_DELAY &&
            timestamp < block.timestamp + MAXIMUM_DELAY,
            "Invalid timestamp"
        );
        bytes32 txId = keccak256(abi.encode(
            to,
            funcName,
            data,
            value,
            timestamp
        ));

        require(!queue[txId], "Already queued");

        queue[txId] = true;

        txs[txId] = Transaction({
            uid: txId,
            executed: false,
            confirmations: 0
        });

        emit Queued(txId);

        return txId;
    }

    function confirm(bytes32 txId) external onlyOwner {
        require(queue[txId], "Not queued!");
        require(!confirmations[txId][msg.sender], "Already confirmed!");

        Transaction storage transaction = txs[txId];

        transaction.confirmations++;
        confirmations[txId][msg.sender] = true;
    }


    function cancelConfirmation(bytes32 txId) external onlyOwner {
        require(queue[txId], "Not queued!");
        require(confirmations[txId][msg.sender], "Not confirmed!");

        Transaction storage transaction = txs[txId];
        transaction.confirmations--;
        confirmations[txId][msg.sender] = false;
    }

    function execute(
        address to,
        string calldata funcName,
        bytes calldata data,
        uint value,
        uint timestamp
    ) external payable onlyOwner returns(bytes memory) {
        require(to != address(0), "Invalid target");

        require(
            block.timestamp > timestamp,
            "too early"
        );
        require(
            timestamp + GRACE_PERIOD > block.timestamp,
            "tx expired"
        );

        bytes32 txId = keccak256(abi.encode(
            to,
            funcName,
            data,
            value,
            timestamp
        ));

        require(queue[txId], "Not queued!");

        Transaction storage transaction = txs[txId];

        require(transaction.confirmations >= CONFIRMATIONS_REQUIRED, "Not enough confirmations!");

        delete queue[txId];

        transaction.executed = true;

        bytes memory callData;
        if(bytes(funcName).length > 0) {
            callData = abi.encodePacked(
                bytes4(keccak256(bytes(funcName))),
                data
            );
        } else {
            callData = data;
        }

        emit Executed(txId);

        (bool success, bytes memory resp) = to.call{value: value}(callData);
        require(success, "Call failed");
        
        return resp;
    }

    function discard(bytes32 txId) external onlyOwner {
        require(queue[txId], "Not queued!");

        delete queue[txId];

        emit Discarded(txId);
    }
}