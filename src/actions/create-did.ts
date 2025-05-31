import axios from "axios";
import crypto from "expo-crypto";
import { createKey } from "./create-key";

const cheqdApiUrl = process.env.CHEQD_API_URL;

export const createDID = async () => {
  const didUUID = crypto.randomUUID();
  const generateDID = `did:cheqd:testnet:${didUUID}`;
  const key = await createKey();

  const cheqdPayload = {
    network: "testnet",
    identifierFormatType: "uuid",
    assertionMethod: true,
    options: {
      key: key,
      verificationMethodType: "Ed25519VerificationKey2020",
    },
    didDocument: {
      "@context": ["https://w3id.org/security/suites/ed25519-2020/v1"],
      id: generateDID,
      controller: [generateDID],
      authentication: [`${generateDID}#key-1`],
      service: [
        {
          id: `${generateDID}#service-1`,
          type: "LinkedDomains",
          serviceEndpoint: ["https://example.com"],
        },
      ],
    },
  };

  const response = await axios.post(`${cheqdApiUrl}/did/create`, cheqdPayload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CHEQD_API_KEY,
    },
  });
  return response.data;
};
