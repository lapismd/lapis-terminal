import { bundleToJSON } from "@sigstore/bundle";
import {
  CIContextProvider,
  DSSEBundleBuilder,
  FulcioSigner,
  RekorWitness,
} from "@sigstore/sign";

// Public SDK composition retains the previous high-level SDK's production
// endpoints, DSSE entry type, retry/timeout and conflict behavior.
export async function attest(payload, payloadType) {
  const network = { retry: { retries: 2 }, timeout: 5000 };
  const builder = new DSSEBundleBuilder({
    certificateChain: false,
    signer: new FulcioSigner({
      ...network,
      fulcioBaseURL: "https://fulcio.sigstore.dev",
      identityProvider: new CIContextProvider("sigstore"),
    }),
    witnesses: [
      new RekorWitness({
        ...network,
        rekorBaseURL: "https://rekor.sigstore.dev",
        entryType: "dsse",
        fetchOnConflict: false,
      }),
    ],
  });
  return bundleToJSON(
    await builder.create({ data: payload, type: payloadType }),
  );
}
