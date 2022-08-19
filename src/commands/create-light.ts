import type { Arguments, CommandBuilder } from 'yargs';

import * as Kilt from '@kiltprotocol/sdk-js';

type Options = {
  seed: string;
  // upper: boolean | undefined;
};

export const command: string = 'create-light <seed>';
export const desc: string = 'Create light did <seed>';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    // .options({
    //   upper: { type: 'boolean' },
    // })
    .positional('seed', { type: 'string', demandOption: true });

export const handler = async (argv: Arguments<Options>) => {
  const { seed } = argv;

  console.log("Creating light DID with seed:", seed);

  // await Kilt.init({ address: 'ws://127.0.0.1:9944/' });
  // await Kilt.connect();

  const keyStore = new Kilt.Did.DemoKeystore();

  const did = await createSimpleLightDid(keyStore, seed);

  console.log("Result DID:", JSON.stringify(did, null, 2));

  // await Kilt.disconnect();
  
  process.exit(0);
};



export async function createSimpleLightDid(
  keystore: Kilt.Did.DemoKeystore,
  authenticationSeed: string | undefined = undefined
): Promise<Kilt.Did.LightDidDetails> {
  // Ask the keystore to generate a new keypair to use for authentication with the generated seed.
  // If no `authenticationSeed` is provided, a random one will be generated.
  const authenticationKeyPublicDetails = await keystore.generateKeypair({
    alg: Kilt.Did.SigningAlgorithms.Ed25519,
    seed: authenticationSeed
  })

  // Create a light DID from the generated authentication key.
  const lightDID = Kilt.Did.LightDidDetails.fromDetails({
    authenticationKey: {
      publicKey: authenticationKeyPublicDetails.publicKey,
      type: Kilt.VerificationKeyType.Ed25519
    }
  })
  console.log(lightDID.uri)

  return lightDID
}