import "LiveLibsUtils.sol";

contract LibFund {
    struct Fund {
        address author;
        uint threshold;
        uint totalValue;
    }

    event Setup(bytes32 name, uint threshold, address author);
    event Update(bytes32 name, uint threshold);
    event FundsAdded(bytes32 name, address contributor, uint contribution, uint totalValue);

    //       name                versionNum
    mapping (bytes32 => mapping (uint => Fund)) public funds;

    address public creator = msg.sender;
    address public owner;

    function setOwner(address o) {
        if (creator != msg.sender) throw;
        owner = o; // Should be the LiveLibs instance
    }

    function setThreshold(bytes32 name, uint versionNum, uint threshold, address author) {
        if (author == 0) throw;

        // Only accept the contract owner or the library author
        if (owner != msg.sender && funds[name][versionNum].author != msg.sender)
            throw;

        if (funds[name][versionNum].author == 0) {
            Setup(name, threshold, author);
            funds[name][versionNum].threshold = threshold;
            funds[name][versionNum].author = author;

        } else {
            Update(name, threshold);
            funds[name][versionNum].threshold = threshold;
        }
    }
    
    function addTo(bytes32 name, uint major, uint minor, uint patch) {
        uint versionNum = LiveLibsUtils.toVersionNum(major, minor, patch);
        if (funds[name][versionNum].author == 0) throw;

        funds[name][versionNum].totalValue += msg.value;
        FundsAdded(name, msg.sender, msg.value, funds[name][versionNum].totalValue);

        // TODO: Just let the funds flow through?
        // Or hold it until the threshold is met?
        // Then we would need to have an end date and refund. Bletch.
        funds[name][versionNum].author.send(msg.value);
    }

    function isLocked(bytes32 name, uint versionNum) constant returns (bool) {
        return funds[name][versionNum].threshold > funds[name][versionNum].totalValue;
    }

    function get(bytes32 name, uint versionNum) constant returns(address, uint, uint) {
        Fund f = funds[name][versionNum];
        return (f.author, f.threshold, f.totalValue);
    }
}
