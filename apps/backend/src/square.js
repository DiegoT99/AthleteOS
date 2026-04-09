import squarePkg from 'square';

const { SquareClient, SquareEnvironment } = squarePkg;

export const squareClient = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

export const paymentsApi = squareClient.payments;
export const customersApi = squareClient.customers;
