import "LibFund.sol";

contract LiveLibs {
    struct Version {
        address a;
        string abi;
        address author;
        bytes32[] resourceKeys;
        mapping (bytes32 => string) resources;
    }

    event NewLib(bytes32 indexed libName, address owner);
    event NewVersion(bytes32 indexed libName, uint versionNum, uint thresholdWei);
    event NewResource(bytes32 indexed libName, uint versionNum, bytes32 key, string resourceURI);
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

    function register(bytes32 libName, uint versionNum, address a, string abi, uint thresholdWei) {
        if (ownerMap[libName] == 0) {
            ownerMap[libName] = msg.sender;
            names.push(libName);
            NewLib(libName, msg.sender);
        } else if (ownerMap[libName] != msg.sender) {
            throw; // Once a lib has an owner, only they can release
        }

        if (versions[libName][versionNum].a == 0) {
            versionMap[libName].push(versionNum);
            Version v = versions[libName][versionNum];
            v.a = a;
            v.abi = abi;
            v.author = msg.sender;
            libFund.setThreshold(libName, versionNum, thresholdWei, msg.sender);
            NewVersion(libName, versionNum, thresholdWei);
        }
    }

    function registerResource(bytes32 libName, uint versionNum, bytes32 key, string uri) {
        Version v = versions[libName][versionNum];
        if (!stringsEqual(v.resources[key], "")) throw; // TODO: need to test this
        v.resourceKeys.push(key);
        v.resources[key] = uri;
        NewResource(libName, versionNum, key, uri);
    }

    // TODO: implement in CLI
    function transferLibOwnership(bytes32 libName, address newOwner) onlyLibOwner(libName) {
        OwnershipChange(libName, ownerMap[libName], newOwner);
        ownerMap[libName] = newOwner;
    }

    function get(bytes32 libName, uint versionNum) constant returns (address, string, bytes32[], uint, uint) {
        Version v = versions[libName][versionNum];
        if (v.a == 0 || libFund.isLocked(libName, versionNum)) return;
        var (_, threshold, totalValue) = libFund.funds(libName, versionNum);
        return (v.a, v.abi, v.resourceKeys, threshold, totalValue);
    }

    function getResource(bytes32 libName, uint versionNum, bytes32 key) constant returns (string) {
        Version v = versions[libName][versionNum];
        return v.resources[key];
    }

    function getVersions(bytes32 libName) constant returns (uint[]) {
        return versionMap[libName];
    }

    function allNames() constant returns (bytes32[]) {
        return names;
    }

    // Extract to library! :)
    function stringsEqual(string storage _a, string memory _b) internal returns (bool) {
        bytes storage a = bytes(_a);
        bytes memory b = bytes(_b);
        if (a.length != b.length)
            return false;
        for (uint i = 0; i < a.length; i ++)
            if (a[i] != b[i])
                return false;
        return true;
    }

    function() { throw; }
}
