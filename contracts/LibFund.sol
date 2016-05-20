contract LibFund {
    struct Fund {
        address author;
        uint threshold;
        uint totalValue;
    }

    event Setup(bytes32 indexed libName, uint versionNum, uint threshold, address author);
    event Update(bytes32 indexed libName, uint versionNum, uint threshold);
    event FundsAdded(bytes32 indexed libName, uint versionNum, address contributor, uint contribution, uint totalValue);

    //       libName             versionNum
    mapping (bytes32 => mapping (uint => Fund)) public funds;

    address public creator = msg.sender;
    address public owner;

    function setOwner(address o) {
        if (creator != msg.sender) throw;
        owner = o; // Should be the LiveLibs instance
    }

    function setThreshold(bytes32 libName, uint versionNum, uint threshold, address author) {
        if (author == 0) throw;

        // Only accept the contract owner or the library author
        if (owner != msg.sender && funds[libName][versionNum].author != msg.sender)
            throw;

        if (funds[libName][versionNum].author == 0) {
            Setup(libName, versionNum, threshold, author);
            funds[libName][versionNum].threshold = threshold;
            funds[libName][versionNum].author = author;

        } else {
            // TODO: There is no interface that allows anyone to reset threshold
            Update(libName, versionNum, threshold);
            funds[libName][versionNum].threshold = threshold;
        }
    }
    
    function addTo(bytes32 libName, uint versionNum) {
        if (funds[libName][versionNum].author == 0) throw;

        funds[libName][versionNum].totalValue += msg.value;
        FundsAdded(libName, versionNum, msg.sender, msg.value, funds[libName][versionNum].totalValue);

        funds[libName][versionNum].author.send(msg.value);
    }

    function isLocked(bytes32 libName, uint versionNum) constant returns (bool) {
        return funds[libName][versionNum].threshold > funds[libName][versionNum].totalValue;
    }

    function get(bytes32 libName, uint versionNum) constant returns(address, uint, uint) {
        Fund f = funds[libName][versionNum];
        return (f.author, f.threshold, f.totalValue);
    }
}
