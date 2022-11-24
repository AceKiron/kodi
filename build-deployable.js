const fs = require("fs");
const crypto = require("crypto");

const axios = require("axios");

const PREFIX = "./dist";

const download = async(url, path) => {
    const writer = fs.createWriteStream(path);
  
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

if (fs.existsSync(PREFIX)) fs.rmSync(PREFIX, { recursive: true });
fs.mkdirSync(PREFIX);

for (const staticFile of fs.readdirSync("./static")) {
    fs.copyFileSync(`./static/${staticFile}`, `${PREFIX}/${staticFile}`);
}

let addonsXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<addons>`;

let plugins = {
    "https://raw.githubusercontent.com/thecrewwh/zips/master/matrix/_zip/plugin.video.watchnixtoons2/": "plugin.video.watchnixtoons2"
};

let finished = 0;
Object.entries(plugins).forEach(async (plugin) => {
    const addonXml = (await axios.get(plugin[0] + "addon.xml")).data;
    addonsXmlContent += addonXml;

    const version = addonXml.match(/<addon .+ version="\S+"/)[0].match(/version="\S+"/)[0].replace("version=\"", "").replace("\"", "");
    
    fs.mkdirSync(`${PREFIX}/${plugin[1]}`);

    await download(`${plugin[0]}${plugin[1]}-${version}.zip`, `${PREFIX}/${plugin[1]}/${plugin[1]}-${version}.zip`);

    finished++;
});
new Promise((res, rej) => {
    let l = Object.keys(plugins).length;
    let x = setInterval(() => {
        if (finished == l) {
            res();
            clearInterval(x);
        }
    }, 50);
}).then(() => {
    addonsXmlContent += "</addons>";
    fs.writeFileSync(`${PREFIX}/addons.xml`, addonsXmlContent);
    fs.writeFileSync(`${PREFIX}/addons.xml.md5`, crypto.createHash("md5").update(addonsXmlContent).digest("hex"));
});