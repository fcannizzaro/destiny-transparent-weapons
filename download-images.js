const axios = require("axios");
const fs = require("fs");

process.on("uncaughtException", (err) => {
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

const downloadFile = async (fileUrl, outputLocationPath) => {
  const res = await axios({
    url: `https://www.bungie.net${fileUrl}`,
    responseType: "stream",
  });
  const writer = fs.createWriteStream(outputLocationPath);
  return new Promise((resolve, reject) => {
    res.data.pipe(writer);
    let error = null;
    writer.on("error", (err) => {
      error = err;
      writer.close();
      fs.unlinkSync(outputLocationPath);
    });
    writer.on("close", () => {
      if (!error) {
        resolve(true);
      }
    });
  });
};

const weaponsBuckets = [1498876634, 2465295065, 953998645];

const init = async () => {
  const { data } = await axios.get(
    `https://www.bungie.net/Platform/Destiny2/Manifest`,
    {
      headers: {
        "X-API-Key": process.env.BUNGIE_TOKEN,
      },
    }
  );

  const inventoryItemDefinition = await axios.get(
    `https://www.bungie.net/${data.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition}`
  );

  const items = Object.values(inventoryItemDefinition.data);

  const weaponsDone = Object.fromEntries(
    fs.readdirSync(__dirname + "/images").map((it) => it.split("."))
  );

  const weapons = items
    .filter(
      (it) =>
        [6, 5].includes(it.inventory?.tierType) &&
        it.itemType === 3 &&
        !weaponsDone[it.hash] &&
        !it.nonTransferrable &&
        weaponsBuckets.includes(it.inventory?.bucketTypeHash)
    )
    .map((it) => [it.hash, it.screenshot]);

  fs.mkdirSync(__dirname + "/download", {
    recursive: true,
  });

  await Promise.allSettled(
    weapons.map(([name, url]) => downloadFile(url, `./download/${name}.jpg`))
  );
};

init().then();
