// Mock firebase.utility so tests never hit real Firebase / initializeApp
export const sendPush = jest.fn().mockResolvedValue(true);
