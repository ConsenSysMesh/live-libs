# Live Libs for Solidity

Providing resusable Solidity libraries that are live on the Ethereum blockchain.

## Install

    $ npm install -g live-libs

## How to get a live library

From the command line:

    $ live-libs get LibName --env testrpc # or morden or live

Via web3:

    var web3 = ... // setup web3 object
    
    var LiveLibs = require('live-libs');
    var liveLibs = new LiveLibs(web3);
    var libName = "Foo";
    var env = "testrpc"; // or "morden" or "live"
    var libData = liveLibs.get(libName, env);
    console.log(libData.abi);
    console.log(libData.address);

## How to register a live library

From the command line:

    $ live-libs register YourLibName --abi '[...]' --address 0x45e2... --env testnet # or morden or live

__Warning:__ There is no way to update or remove your library. Once it's live it's live forever.

__Warning:__ This software is under active development and the Live Libs registry will be replaced without warning. (Other than this warning.)

## TODO

* "provide a way to get library information via a Javascript interface" @tcoulter
* Consider shelling out to `solc` on the command line, generate the abstract libs on the file system, providing the path like [this](https://solidity.readthedocs.io/en/latest/layout-of-source-files.html#use-in-actual-compilers).
* Experiment with truffle integration
* Experiment with dapple integration
* Rework the system into one or more command line apps
* Improve multiple environment support, especially: how to test against these libraries using ethereumjs/testrpc.
* Extract environment migrator into its own repo /via @tcoulter
* Consider the tradeoffs of allowing for library upgrades, or whether we should have versions (or both)

## Author

Dave Hoover <dave.hoover@consensys.net>
