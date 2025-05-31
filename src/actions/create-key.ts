import axios from "axios";

export const createKey = async (cheqdApiUrl: string, cheqdApiKey: string) => {
  try {
    console.log("tes create key");
    const response = await axios.post(
      `${cheqdApiUrl}/key/create`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cheqdApiKey,
        },
      }
    );
    console.log(response.data);
    console.log(response.data.kid);
    return response.data.kid;
  } catch (error) {
    console.log(error);
  }
};
