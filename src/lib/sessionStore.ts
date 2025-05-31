import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "userSession";

export interface UserSession {
  userId: string;
  token?: string;
  name?: string;
  email?: string;
}

export const saveSession = async (session: UserSession): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(session);
    await AsyncStorage.setItem(SESSION_KEY, jsonValue);
    console.log("User session saved");
  } catch (e) {
    console.log("Failed to save user session.", e);
  }
};

export const loadSession = async (): Promise<UserSession | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_KEY);
    if (jsonValue != null) {
      const session: UserSession = JSON.parse(jsonValue);
      console.log("User session loaded:", session);

      return session;
    } else {
      console.log("No user session found.");
      return null;
    }
  } catch (e) {
    console.log("Failed to load user session.", e);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    console.log("User session cleared.");
  } catch (e) {
    console.log("Failed to clear user session.", e);
  }
};
