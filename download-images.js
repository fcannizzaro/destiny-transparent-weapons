const axios = require('axios');
const fs = require('fs');

const downloadFile = async (fileUrl, outputLocationPath) => {
    const writer = fs.createWriteStream(outputLocationPath);
    const res = await axios({
        url: 'https://www.bungie.net' + fileUrl,
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        res.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
            error = err;
            writer.close();
            reject(err);
        });
        writer.on('close', () => {
            if (!error) {
                resolve(true);
            }
        });
    });
}

const weaponsBuckets = [1498876634, 2465295065, 953998645];

const init = async () => {

    const {data} = await axios.get(`https://www.bungie.net/Platform/Destiny2/Manifest`, {
        headers: {
            'X-API-Key': process.env.BUNGIE_TOKEN,
        }
    });

    const inventoryItemDefinition = await axios.get(
        `https://www.bungie.net/${data.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition}`,
    );

    const items = Object.values(inventoryItemDefinition.data);

    const weaponsDone = Object.fromEntries(
        fs
            .readdirSync(__dirname + '/images')
            .map(it => it.split('.')
            )
    );

    const weapons = items.filter((it) => (
            [6, 5].includes(it.inventory?.tierType) &&
            it.itemType === 3 &&
            !weaponsDone[it.hash] &&
            !it.nonTransferrable &&
            weaponsBuckets.includes(it.inventory?.bucketTypeHash)
        )
    ).map(it => [it.hash, it.screenshot]);

    fs.mkdirSync(__dirname + '/download');

    await Promise.all(weapons.map(([name, url]) => downloadFile(url, `./download/${name}.jpg`)))

}

init().then();
