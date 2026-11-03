const fs=require('node:fs'),path=require('node:path');
function dataDirectory(){if(process.env.CAPRI_DATA_DIR)return process.env.CAPRI_DATA_DIR;const base=process.env.LOCALAPPDATA||path.join(__dirname,'..');const legacy=path.join(base,'Capri');return fs.existsSync(legacy)?legacy:path.join(base,'Capricorn');}
module.exports={dataDirectory};
