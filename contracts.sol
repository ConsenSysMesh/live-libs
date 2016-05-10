contract LiveLibs {
    struct Version {
        address a;
        string abi;
        address sender;
    }

    bytes32[] public names; // TODO: Make this a Set

    //       name                major            minor             patch
    mapping (bytes32 => mapping (uint8 => mapping(uint8 => mapping (uint8 => Version)))) public versions;

    // Allows people to grab all the versions for a specific lib.
    // The version is stored as a single number.
    mapping (bytes32 => uint[]) public versionMap;
    
    function register(bytes32 name, uint8 major, uint8 minor, uint8 patch, address a, string abi) {
        if (versions[name][major][minor][patch].a == 0) {
            names.push(name);
            versionMap[name].push(1000000*major + 1000*minor + patch);
            versions[name][major][minor][patch] = Version({ a: a, abi: abi, sender: msg.sender});
        }
    }

    function get(bytes32 name, uint8 major, uint8 minor, uint8 patch) constant returns (address, string) {
        Version v = versions[name][major][minor][patch];
        if (v.a == 0) return;
        return (v.a, v.abi);
    }

    function getVersions(bytes32 name) constant returns (uint[]) {
        return versionMap[name];
    }

    function list() constant returns (bytes32[]) {
        return names;
    }
}
