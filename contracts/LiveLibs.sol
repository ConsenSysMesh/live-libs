import "LibFund.sol";
import "LiveLibsUtils.sol";

contract LiveLibs {
    struct Version {
        address a;
        string abi;
        address author;
    }

    event NewLib(bytes32 name, address owner);
    event NewVersion(bytes32 name, uint8 major, uint8 minor, uint8 patch, uint thresholdWei);
    event OwnershipChange(bytes32 name, address oldOwner, address newOwner);

    bytes32[] public names;

    //       name                major            minor             patch
    mapping (bytes32 => mapping (uint8 => mapping(uint8 => mapping (uint8 => Version)))) public versions;

    // Allows people to grab all the versions for a specific lib.
    // The version is stored as a single number.
    mapping (bytes32 => uint[]) public versionMap;

    // Helps enforce lib ownership
    mapping (bytes32 => address) public ownerMap;
    
    LibFund public libFund;
    address public creator = msg.sender;

    function LiveLibs(LibFund lf) {
        setLibFund(lf);
    }

    // This provides flexibility to upgrade/migrate LibFund
    function setLibFund(LibFund lf) {
        if (creator != msg.sender) throw;
        libFund = lf;
    }

    function register(bytes32 name, uint8 major, uint8 minor, uint8 patch, address a, string abi, uint thresholdWei) {
        if (ownerMap[name] == 0) {
            ownerMap[name] = msg.sender;
            names.push(name);
            NewLib(name, msg.sender);
        } else if (ownerMap[name] != msg.sender) {
            throw; // Once a lib has an owner, only they can release
        }

        if (versions[name][major][minor][patch].a == 0) {
            uint versionNum = LiveLibsUtils.toVersionNum(major, minor, patch);
            versionMap[name].push(versionNum);
            versions[name][major][minor][patch] = Version({
                a: a,
                abi: abi,
                author: msg.sender
            });
            libFund.setThreshold(name, versionNum, thresholdWei, msg.sender);
            NewVersion(name, major, minor, patch, thresholdWei);
        }
    }

    // TODO: implement in CLI
    function transferLibOwnership(bytes32 name, address newOwner) {
        if (ownerMap[name] != msg.sender) throw;
        OwnershipChange(name, ownerMap[name], newOwner);
        ownerMap[name] = newOwner;
    }

    function get(bytes32 name, uint8 major, uint8 minor, uint8 patch) constant returns (address, string, uint, uint) {
        Version v = versions[name][major][minor][patch];
        uint versionNum = LiveLibsUtils.toVersionNum(major, minor, patch);
        if (v.a == 0 || libFund.isLocked(name, versionNum)) return;
        var (_, threshold, totalValue) = libFund.funds(name, versionNum);
        return (v.a, v.abi, threshold, totalValue);
    }

    function getVersions(bytes32 name) constant returns (uint[]) {
        return versionMap[name];
    }

    function allNames() constant returns (bytes32[]) {
        return names;
    }

    function() { throw; }
}
