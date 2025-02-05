const os = require('os');
const fs = require('fs');

function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    // Проверьте, что это нужный интерфейс (например, 'Ethernet 2')
    if (interfaceName === 'Ethernet 2') {
      for (const interfaceInfo of networkInterfaces[interfaceName]) {
        if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
          return interfaceInfo.address;
        }
      }
    }
  }
}

//console.log('Local IP (Ethernet 2):', getLocalIP());

const newIP = {
    "data": {
        "ip": getLocalIP(),
    }
};

console.log(newIP);


// fs.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data){
//     if (err){
//         console.log(err);
//     } else {
//     obj = JSON.parse(data); //now it an object
//     obj.table.push({id: 2, square:3}); //add some data
//     json = JSON.stringify(obj); //convert it back to json
//     fs.writeFile('myjsonfile.json', json, 'utf8', callback); // write it back 
// }});

fs.writeFileSync('nodeJS/myIP.json', JSON.stringify(newIP));
// fs.writeFileSync('file.json', JSON.stringify(jsonVariable));
// fs.writeFileSync( {'file.json', ...JSON.stringify(jsonVariable)});