const fs = require("fs");
const crypto = require("crypto");

const zipLocal = require("zip-local");

const PREFIX = "./dist";

const DATE = new Date();
const VERSION = `${DATE.getFullYear()}.${DATE.getMonth()}.${DATE.getDate()}.${DATE.getHours() * 3600 + DATE.getMinutes() * 60 + DATE.getSeconds()}`;

if (fs.existsSync(PREFIX)) fs.rmSync(PREFIX, { recursive: true });
fs.mkdirSync(PREFIX);

for (const staticFile of fs.readdirSync("./static")) {
    fs.copyFileSync(`./static/${staticFile}`, `${PREFIX}/${staticFile}`);
}

let addonsXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<addons>`;

for (const plugin of fs.readdirSync("./src").filter((folder) => folder.startsWith("plugin."))) {
    const addonXml = fs.readFileSync(`./src/${plugin}/${plugin}/addon.xml`).toString().replaceAll("0.1.0", VERSION);
    addonsXmlContent += addonXml.split("\n").slice(1).join("\n") + "\n";

    fs.writeFileSync(`./src/${plugin}/${plugin}/addon.xml`, addonXml);

    fs.mkdirSync(`${PREFIX}/${plugin}`);

    zipLocal.sync.zip(`./src/${plugin}`).compress().save(`./dist/${plugin}/${plugin}-${VERSION}.zip`);
}

addonsXmlContent += "</addons>";
fs.writeFileSync(`${PREFIX}/addons.xml`, addonsXmlContent);
fs.writeFileSync(`${PREFIX}/addons.xml.md5`, crypto.createHash("md5").update(addonsXmlContent).digest("hex"));
