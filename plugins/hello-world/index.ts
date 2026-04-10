export const manifest = {
  name: "Hello World Plugin",
  collections: ["hello_messages"],
  hasPanel: true,
  pageRef: "/p/hello-world",
  apiRef: "/api/plugins/hello-world/run"
};

export const run = async (db: any, params: any) => {
  console.log("Hello World Plugin running...");
  return { message: "Hello from the plugin system!" };
};
