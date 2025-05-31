import axios from "axios";
import { createKey } from "./create-key";

export const createDID = async (
  cheqdApiUrl: string,
  cheqdApiKey: string,
  didUUID: string
) => {
  console.log("tes createdid");
  try {
    const generateDID = `did:cheqd:testnet:${didUUID}`;
    const key = await createKey(cheqdApiUrl, cheqdApiKey);

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

    const response = await axios.post(
      `${cheqdApiUrl}/did/create`,
      cheqdPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cheqdApiKey,
        },
      }
    );
    console.log(response.data.did);
    return response.data.did;
  } catch (error) {
    console.log(error);
  }
};
