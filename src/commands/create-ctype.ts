import type { Arguments, CommandBuilder } from 'yargs';

import * as Kilt from '@kiltprotocol/sdk-js';
import { KeyringPair } from '@kiltprotocol/sdk-js';

import { Keyring } from "@polkadot/api";

import { createCompleteFullDid } from './create-full';

type Options = {
  seed: string;
};

export const command: string = 'create-ctype';
export const desc: string = 'Create Credential type';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .positional('fields', { type: 'string', demandOption: true });

export const handler = async (argv: Arguments<Options>) => {
  const { fields } = argv;

  console.log("Creating light DID with fields:", fields);

  await Kilt.init({ address: 'ws://127.0.0.1:9944/' });
  const api = await Kilt.connect();

  const keyring = new Keyring({type: 'ed25519'});
  const alice = keyring.addFromUri('//Alice');

  const keyStore = new Kilt.Did.DemoKeystore();

  const identifier = "did:kilt:4phssKR7xkQBwdxQwq6wpKztSLPtrDxL65H4vpT8zTy6MXZQ";
  const seed = "222";
  // const identifier = "4phssKR7xkQBwdxQwq6wpKztSLPtrDxL65H4vpT8zTy6MXZQ";

  // const did = await Kilt.Did.Chain.queryDetails(identifier);
  // const did = await Kilt.Did.FullDidDetails.fromChainInfo(identifier as any);

  const did = await createCompleteFullDid(keyStore, api.api, alice, seed);

  console.log("🚀 ~ file: create-ctype.ts ~ line 39 ~ handler ~ did", did)

  const ctype = await createDriversLicenseCType(keyStore, did as any, alice);

  console.log("ctype: ", ctype);

  await Kilt.disconnect();
  
  process.exit(0);
};


export async function createDriversLicenseCType(
  keystore: Kilt.Did.DemoKeystore,
  creatorDid: Kilt.Did.FullDidDetails,
  submitterAccount: KeyringPair,
  resolveOn: Kilt.SubscriptionPromise.ResultEvaluator = Kilt.BlockchainUtils
    .IS_FINALIZED
): Promise<Kilt.CType> {
  // Create a new CType definition.
  const ctype = Kilt.CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: `Drivers License by ${creatorDid.uri}`,
    properties: {
      name: {
        type: 'string'
      },
      age: {
        type: 'integer'
      },
      id: {
        type: 'string'
      }
    },
    type: 'object'
  })

  // Generate a creation extrinsic and sign it with the attester's attestation key.
  const ctypeCreationTx = await ctype
    .getStoreTx()
    .then((tx) =>
      creatorDid.authorizeExtrinsic(tx, keystore, submitterAccount.address)
    )
  // Submit the creation extrinsic to the KILT blockchain
  // using the KILT account specified in the creation operation.
  await Kilt.BlockchainUtils.signAndSubmitTx(
    ctypeCreationTx,
    submitterAccount,
    { resolveOn }
  )

  return ctype
}


