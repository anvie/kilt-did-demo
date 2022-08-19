import type { Arguments, CommandBuilder } from 'yargs';

import type { KeyringPair } from '@polkadot/keyring/types'

import { blake2AsHex, randomAsHex } from '@polkadot/util-crypto'
import { ApiPromise, Keyring } from '@polkadot/api'

import * as Kilt from '@kiltprotocol/sdk-js';

type Options = {
  seed: string;
};

export const command: string = 'create-full <seed>';
export const desc: string = 'Create full did <seed>';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .positional('seed', { type: 'string', demandOption: true });

export const handler = async (argv: Arguments<Options>) => {
  const { seed } = argv;

  console.log("Creating full DID with seed:", seed);

  await Kilt.init({ address: 'ws://127.0.0.1:9944/' });
  const api = await Kilt.connect();

  const keyStore = new Kilt.Did.DemoKeystore();

  // const acc = await keyStore.generateKeypair({seed: "//Alice", alg: Kilt.Did.SigningAlgorithms.Ed25519});
  const keyring = new Keyring({type: 'ed25519'});

  const acc = keyring.addFromUri('//Alice');
  
  const did = await createCompleteFullDid(keyStore, api.api, acc, seed);

  console.log("Result DID:", JSON.stringify(did, null, 2));

  // await Kilt.disconnect();
  
  process.exit(0);
};


export async function createCompleteFullDid(
  keystore: Kilt.Did.DemoKeystore,
  api: ApiPromise,
  submitterAccount: KeyringPair,
  authenticationSeed: string | undefined = undefined,
  resolveOn: Kilt.SubscriptionPromise.ResultEvaluator = Kilt.BlockchainUtils
    .IS_FINALIZED
): Promise<Kilt.Did.FullDidDetails> {
  authenticationSeed = authenticationSeed || randomAsHex(32)
  // Create the attestation key seed by hasing the provided authentication seed.
  const attestationSeed = blake2AsHex(authenticationSeed)
  // Create the delegation key seed by hasing the generated attestation key seed.
  const delegationSeed = blake2AsHex(attestationSeed)

  // Ask the keystore to generate a new keypair to use for authentication.
  const authenticationKeyPublicDetails = await keystore.generateKeypair({
    seed: authenticationSeed,
    alg: Kilt.Did.SigningAlgorithms.Ed25519
  })

  const encryptionSeed = randomAsHex(32)
  // Ask the keystore to generate a new keypar to use for encryption.
  const encryptionKeyPublicDetails = await keystore.generateKeypair({
    seed: encryptionSeed,
    alg: Kilt.Did.EncryptionAlgorithms.NaclBox
  })

  const attestationKeyPublicDetails = await keystore.generateKeypair({
    seed: attestationSeed,
    alg: Kilt.Did.SigningAlgorithms.Sr25519
  })

  const delegationKeyPublicDetails = await keystore.generateKeypair({
    seed: delegationSeed,
    alg: Kilt.Did.SigningAlgorithms.EcdsaSecp256k1
  })

  const fullDid = await new Kilt.Did.FullDidCreationBuilder(api, {
    publicKey: authenticationKeyPublicDetails.publicKey,
    type: Kilt.VerificationKeyType.Ed25519
  })
    .addEncryptionKey({
      publicKey: encryptionKeyPublicDetails.publicKey,
      type: Kilt.EncryptionKeyType.X25519
    })
    .setAttestationKey({
      publicKey: attestationKeyPublicDetails.publicKey,
      type: Kilt.VerificationKeyType.Sr25519
    })
    .setDelegationKey({
      publicKey: delegationKeyPublicDetails.publicKey,
      type: Kilt.VerificationKeyType.Ecdsa
    })
    .addServiceEndpoint({
      id: 'my-service',
      types: ['service-type'],
      urls: ['https://www.example.com']
    })
    .buildAndSubmit(keystore, submitterAccount.address, async (creationTx) => {
      await Kilt.BlockchainUtils.signAndSubmitTx(creationTx, submitterAccount, {
        resolveOn
      })
    })

  if (!fullDid) {
    throw 'Could not find the DID just created.'
  }
  return fullDid
}
