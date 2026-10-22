/* global Mongo, print, quit, sleep */
// Initialize a single-member rs0 once; preserve existing data and configuration.
let lastError;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const admin = new Mongo(
      "mongodb://mongodb:27017/admin?directConnection=true&serverSelectionTimeoutMS=2000&connectTimeoutMS=2000"
    ).getDB("admin");
    const hello = admin.runCommand({ hello: 1 });
    if (!hello.setName) {
      const result = admin.runCommand({
        replSetInitiate: {
          _id: "rs0",
          members: [{ _id: 0, host: "mongodb:27017" }],
        },
      });
      if (!result.ok) throw new Error(JSON.stringify(result));
    } else {
      const result = admin.runCommand({ replSetGetConfig: 1 });
      if (!result.ok) throw new Error(JSON.stringify(result));
      const config = result.config;
      if (
        config._id !== "rs0" ||
        config.members.length !== 1 ||
        config.members[0].host !== "mongodb:27017"
      ) {
        print(
          "Existing replica-set configuration must be migrated to a single mongodb:27017 member before deployment."
        );
        quit(1);
      }
      if (hello.isWritablePrimary) {
        print("Single-node rs0 ready: mongodb:27017 is PRIMARY");
        quit(0);
      }
    }
  } catch (error) {
    lastError = error.message;
    print(`Waiting for rs0: ${lastError}`);
  }
  sleep(2000);
}
print(
  `Replica-set initialization timed out: ${lastError || "primary not ready"}`
);
quit(1);
