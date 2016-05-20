import "LibFund.sol";

contract LiveLibs {
    struct Version {
        address a;
        string abi;
        address author;
        string docURL;
        string sourceURL;
    }

    event NewLib(bytes32 indexed libName, address owner);
    event NewVersion(bytes32 indexed libName, uint versionNum, uint thresholdWei);
    event OwnershipChange(bytes32 indexed libName, address oldOwner, address newOwner);

    bytes32[] public names;

    //       libName             versionNum
    mapping (bytes32 => mapping (uint => Version)) public versions;

    // Allows people to grab all the versions for a specific lib.
    mapping (bytes32 => uint[]) public versionMap;

    // Helps enforce lib ownership
    mapping (bytes32 => address) public ownerMap;
    
    LibFund public libFund;
    address public creator = msg.sender;

    function LiveLibs(LibFund lf) {
        setLibFund(lf);
    }

    modifier onlyLibOwner(bytes32 libName) {
        if (ownerMap[libName] != msg.sender) throw;
        _
    }

    // This provides flexibility to upgrade/migrate LibFund
    function setLibFund(LibFund lf) {
        if (creator != msg.sender) throw;
        libFund = lf;
    }

    function register(bytes32 libName, uint versionNum, address a, string abi, string docURL, string sourceURL, uint thresholdWei) {
        if (ownerMap[libName] == 0) {
            ownerMap[libName] = msg.sender;
            names.push(libName);
            NewLib(libName, msg.sender);
        } else if (ownerMap[libName] != msg.sender) {
            throw; // Once a lib has an owner, only they can release
        }

        if (versions[libName][versionNum].a == 0) {
            versionMap[libName].push(versionNum);
            versions[libName][versionNum] = Version({
                a: a,
                abi: abi,
                author: msg.sender,
                docURL: docURL,
                sourceURL: sourceURL
            });
            libFund.setThreshold(libName, versionNum, thresholdWei, msg.sender);
            NewVersion(libName, versionNum, thresholdWei);
        }
    }

    // TODO: implement in CLI
    function updateDocURL(bytes32 libName, uint versionNum, string docURL) onlyLibOwner(libName) {
        versions[libName][versionNum].docURL = docURL;
    }

    // TODO: implement in CLI
    function updateSourceURL(bytes32 libName, uint versionNum, string sourceURL) onlyLibOwner(libName) {
        versions[libName][versionNum].sourceURL = sourceURL;
    }

    // TODO: implement in CLI
    function transferLibOwnership(bytes32 libName, address newOwner) onlyLibOwner(libName) {
        OwnershipChange(libName, ownerMap[libName], newOwner);
        ownerMap[libName] = newOwner;
    }

    function get(bytes32 libName, uint versionNum) constant returns (address, string, string, string, uint, uint) {
        Version v = versions[libName][versionNum];
        if (v.a == 0 || libFund.isLocked(libName, versionNum)) return;
        var (_, threshold, totalValue) = libFund.funds(libName, versionNum);
        return (v.a, v.abi, v.docURL, v.sourceURL, threshold, totalValue);
    }

    function getVersions(bytes32 libName) constant returns (uint[]) {
        return versionMap[libName];
    }

    function allNames() constant returns (bytes32[]) {
        return names;
    }

    function() { throw; }
}
