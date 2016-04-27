// live-libs: math

contract simple {
    uint public x;

    function calc(uint y) {
        x = Math.modExp(x, 5, 3);
    }
}