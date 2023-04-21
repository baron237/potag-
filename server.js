var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
var express= require('express')
var app = express()
var path = require('path')
require('dotenv').config();

const SERIAL_PORT = process.env.SERIAL_PORT;



var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

let serialport = new SerialPort(SERIAL_PORT, {
  baudRate: 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

client.on('connect', function () {
  console.log('MQTT connected')
});


function sendRemoteCommandRequest(command, commandParameter) {
  var frame_obj = { 
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: command,
    commandParameter: [commandParameter],
  };
  xbeeAPI.builder.write(frame_obj);
 
}

//connection au port serie et format des requêtes
serialport.on("open", function () {
  frame_obj = { // AT requête
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "D0",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);

  var frame_obj = { //  AT requête
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
  };

  xbeeAPI.builder.write(frame_obj);

});

//connection à l'interface
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))

// fonction d'arrosage
app.get('/aroser', (req, res) => {
  sendRemoteCommandRequest("D0", [05]);
  res.sendStatus(200);
});
// fonction d'arrêt d'arrosage
app.get('/stop', (req, res) => {
  sendRemoteCommandRequest("D0", 0x04);
  res.sendStatus(200);
});

xbeeAPI.parser.on("data", function (frame) {
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(dataReceived)
  } else {
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived)
  }
});

app.listen(8000)