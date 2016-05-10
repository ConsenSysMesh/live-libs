# Live Libs for Solidity

Providing reusable Solidity libraries that are live on the Ethereum blockchain.

## Install

    $ npm install -g live-libs

## Setting up your environment

You will need to be connected to an Ethereum network (testrpc, morden, live, etc) when interacting with live-libs. Follow [these instructions](https://ethereum.gitbooks.io/frontier-guide/content/getting_a_client.html) to install an Ethereum node. The live-libs command line interface currently assumes that the Ethereum node's RPC interface is available via `localhost:8545`.

## Getting a library's information

It's important to note that live-libs does not store source code, but it does store a library's [ABI](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI). In order to compile contracts that use live-libs, you'll need to provide the [library interface](https://github.com/ethereum/wiki/wiki/Solidity-Features#interface-contracts) to the compiler.

__Note__: If you don't specify the `--version`, the latest version is used.

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

## How to register a live library

From the command line:

    $ live-libs register YourLibName --version 3.5.8 --address 0x45e2... --abi '[...]'

__Warning:__ There is no way to remove your library. Once it's live, it's live forever.

__Warning:__ This software is under active development and the live-libs registries (morden and live) will be replaced without warning. (Other than this warning.)

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

## Where is this headed?

* [TODO](https://github.com/ConsenSys/live-libs/blob/master/TODO.md): a few weeks out
* [Roadmap](https://github.com/ConsenSys/live-libs/wiki/Roadmap): a few months out

## Author

Dave Hoover <dave.hoover@consensys.net>
