// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hello = async (payload: any, helpers: any) => {
  if (!payload.name) {
    throw new Error("Missing name");
  }
  const { name } = payload;
  helpers.logger.info(`Hello, ${name}`);
};

export { hello };
