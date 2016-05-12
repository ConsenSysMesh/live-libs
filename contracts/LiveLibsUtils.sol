// Gonna need to link this

library LiveLibsUtils {
    function toVersionNum(uint8 major, uint8 minor, uint8 patch) constant returns (uint) {
        return 1000000*major + 1000*minor + patch;
    }
}