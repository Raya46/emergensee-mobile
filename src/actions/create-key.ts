import axios from "axios";
const cheqdApiUrl = process.env.CHEQD_API_URL;

export const createKey = async () => {
  const response = await axios.post(
    `${cheqdApiUrl}/key/create`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CHEQD_API_KEY,
      },
    }
  );
  //   await AsyncStorage.setItem("cheqdKey",response.data.)
  return response.data;
};
