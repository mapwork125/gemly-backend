// Mock stripe.utility so tests never hit the real Stripe API or require a key
const mockStripe = {
  createPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test' }),
  transferToSeller: jest.fn().mockResolvedValue({ id: 'tr_test' }),
  refundPayment: jest.fn().mockResolvedValue({ id: 'ref_test' }),
  getPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
};

export default mockStripe;
