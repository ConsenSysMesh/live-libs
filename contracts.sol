contract LiveLibs {
    struct LibData {
        address a;
        string abi;
        address sender;
    }

    bytes32[] public names;
    mapping (bytes32 => LibData) public data;
    
    function register(bytes32 name, address a, string abi) {
        if (data[name].a == 0) {
            names.push(name);
            data[name] = LibData({ a: a, abi: abi, sender: msg.sender});
        }
    }

    function get(bytes32 name) constant returns (address, string) {
        if (data[name].a == 0) return;
        LibData d = data[name];
        return (d.a, d.abi);
    }

    function list() constant returns (bytes32[]) {
        return names;
    }
}
