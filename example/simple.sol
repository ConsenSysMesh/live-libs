// Hook into compilation process to resolve this import correctly
import "Math";

contract simple {
    uint public x;

    function calc(uint y) {
        x = Math.modExp(x, y, 3);
    }
}