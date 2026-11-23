export const authUserFixture = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
};

export const authSessionFixture = {
  token: '1|plain-text-token',
  tokenType: 'Bearer',
  user: authUserFixture,
};

export const loginPasswordFixture = 'password';
