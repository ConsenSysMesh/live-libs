# Live Libs for Solidity

Providing reusable Solidity libraries that are live on the Ethereum blockchain.

## Install

    $ npm install -g live-libs

## Setting up your environment

You will need to be connected to an Ethereum network (testrpc, morden, mainnet, etc) when interacting with live-libs. Follow [these instructions](https://ethereum.gitbooks.io/frontier-guide/content/getting_a_client.html) to install an Ethereum node. The live-libs command line interface defaults to `http://localhost:8545` to reach the Ethereum node's RPC interface. You can override this with `--rpcurl https://example:8765`

## Getting a library's information

It's important to note that live-libs does not store source code, but it does store a library's [ABI](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI). In order to compile contracts that use live-libs, you'll need to provide the [library interface](https://github.com/ethereum/wiki/wiki/Solidity-Features#interface-contracts) to the compiler.

__Note__: If you don't specify the version, the latest version of the library is used.

From the command line:

    $ live-libs get LibName [--version 3.5.8]
    Version:
    3.5.8

    Address:
    0x3f4845...

    ABI:
    [{"constant":false,"inputs":...}]

    Abstract source:
    library LibName {...}

Via Javascript:

    var web3 = ... // setup web3 object

    var LiveLibs = require('live-libs');
    var liveLibs = new LiveLibs(web3);
    var libName = "Foo";
    var version = "3.5.8"; // optional
    var libInfo = liveLibs.get(libName, version);
    console.log(libInfo.version);
    console.log(libInfo.address);
    console.log(libInfo.abi);
    console.log(libInfo.abstractSource());
    console.log(libInfo.docURL);
    console.log(libInfo.sourceURL);

## Getting a library's event log

From the command line:

    $ live-libs log LibName
    Event log for Foo...
    2016-04-17T12:34:56Z NewLib! Registered by owner: 0x28bc5a7226a82053aa29c0806c380cfb6a82bb0c
    2016-04-17T12:34:56Z NewVersion! 0.0.1
    2016-05-17T17:27:37Z NewVersion! 0.0.2

Via Javascript:

    liveLibs.log(libName).then(function(events) {
      events.forEach(function(event) {
        console.log(event.type);
        console.log(event.time);
        console.log(event.args);
      });
    });

## How to register a live library

From the command line:

    $ live-libs register YourLibName --version 3.5.8 --address 0x45e2... --abi '[...]' --docurl http://example.com/docs --sourceurl http://example.com/source/lib.sol

__Warning:__ There is no way to remove your library. Once it's live, it's live forever.

__Warning:__ This software is under active development and the live-libs registries (morden and mainnet) will be abandoned without warning. (Other than this warning.)

## Setting up your testrpc environment

Running your tests against [testrpc](https://github.com/ethereumjs/testrpc) is a standard way to speed up your development process. In order to execute the live-libs libraries on your testrpc node, you'll need to deploy the live-libs contract(s) and import the live-libs data. This will require a two-step process:

1. Download the live-libs data from morden (you will need to run a node that connects to that network).
2. Deploy the live-libs contract(s) and data to testrpc.

From the command line:

    $ # running a morden node
    $ live-libs download
    $ # switch to testrpc
    $ live-libs deploy

__Note__: If you restart your testrpc server, you'll need to re-deploy live-libs, but you won't need to re-download the data.

## Funding your library

Library authors can receive ether for registering their libraries with live-libs. When an author registers a library, they can optionally pass in a `--unlockat` flag, followed by a number of wei. This will "lock" the specified version of the library until the specified amount of wei has been contributed. For example:

    $ live-libs register YourLibName --version 3.5.8 --address 0x45e2... --abi '[...]' --unlockat 10000000

This will register `YourLibName 3.5.8` in live-libs, but when you look it up, it will not be available. To unlock it, people need to contribute ether, which gets immediatly redirected to the Ethereum account that registered this version.

If someone wants to contribute ether in order to unlock a version of a library, they can:

    $ live-libs contribute LibName --version 3.5.8 --wei 200000

__Note__: The idea for this came from Vitalik's story at 2:30 of [this podcast](http://futurethinkers.org/vitalik-buterin-ethereum-decentralized-future/).

## Where is this headed?

* [TODO](https://github.com/ConsenSys/live-libs/blob/master/TODO.md): a few weeks out
* [Roadmap](https://github.com/ConsenSys/live-libs/wiki/Roadmap): a few months out

## Author

Dave Hoover <dave.hoover@consensys.net>
