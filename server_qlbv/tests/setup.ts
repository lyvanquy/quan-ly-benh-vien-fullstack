jest.mock('nodemailer', () => ({
  createTransport: () => ({
    verify: (cb: (err: Error | null, success: boolean) => void) => cb(null, true),
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));
