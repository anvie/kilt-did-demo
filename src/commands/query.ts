import type { Arguments, CommandBuilder } from 'yargs';

import type { KeyringPair } from '@polkadot/keyring/types'

import { blake2AsHex, randomAsHex } from '@polkadot/util-crypto'
import { ApiPromise, Keyring } from '@polkadot/api'

import * as Kilt from '@kiltprotocol/sdk-js';

type Options = {
  seed: string;
  // upper: boolean | undefined;
};

export const command: string = 'query <identifier>';
export const desc: string = 'Query DID <identifier>';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    // .options({
    //   upper: { type: 'boolean' },
    // })
    .positional('identifier', { type: 'string', demandOption: true });

export const handler = async (argv: Arguments<Options>) => {
  const { identifier } = argv;

  console.log("Query DID with identifier:", identifier);

  await Kilt.init({ address: 'ws://127.0.0.1:9944/' });
  const api = await Kilt.connect();

  const keyStore = new Kilt.Did.DemoKeystore();

  const record = await Kilt.Did.resolveDoc(identifier as any)
  console.log("🚀 ~ file: query.ts ~ line 36 ~ handler ~ record", record?.details?.getEndpoints())

  console.log("record:", JSON.stringify(record, null, 2));

  const doc = Kilt.Did.exportToDidDocument(record?.details!, "application/json");
  console.log("🚀 ~ file: query.ts ~ line 41 ~ handler ~ doc", JSON.stringify(doc, null, 2));

  // const acc = await keyStore.generateKeypair({seed: "//Alice", alg: Kilt.Did.SigningAlgorithms.Ed25519});
  // const keyring = new Keyring({type: 'ed25519'});

  // const acc = keyring.addFromUri('//Alice');

  // const did = Kilt.Did.resolveDoc()

  // console.log("Result DID:", JSON.stringify(did, null, 2));

  // await Kilt.disconnect();
  
  process.exit(0);
};

