library LiveLibsUtils {
    function toVersionNum(uint major, uint minor, uint patch) constant returns (uint) {
        return 1000000*major + 1000*minor + patch;
    }
}
