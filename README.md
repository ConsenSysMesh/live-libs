# Live Libs for Solidity

Providing resusable Solidity libraries that are live on the Ethereum blockchain.

## How to use a live library

At the top of your solidity file you can "import" live libs in a comment:

    // live-libs: Math, Money

Then, you can feel free to use those libs in your source, such as:

    function calc(uint y) {
      x = Math.modExp(x, y, 3);
    }

Live Libs will link the library and your contract will compile.

## How to register a live library

Using node.js, call the register.js script:

    $ node register.js path/to/source.sol YourLibraryName

__Warning:__ There is no way to update or remove your library. Once it's live it's live forever.

__Warning:__ This software is under active development and the Live Libs registry will be replaced without warning. (Other than this warning.)

## Author

Dave Hoover <dave.hoover@consensys.net>
