
console.log('\x1b[36m', "\r\n████████╗██████╗ ██╗██████╗ ██╗   ██╗███████╗    ██╗    ██╗ █████╗ ██████╗ ██╗\r\n╚══██╔══╝██╔══██╗██║██╔══██╗██║   ██║██╔════╝    ██║    ██║██╔══██╗██╔══██╗██║\r\n   ██║   ██████╔╝██║██████╔╝██║   ██║███████╗    ██║ █╗ ██║███████║██████╔╝██║\r\n   ██║   ██╔══██╗██║██╔══██╗██║   ██║╚════██║    ██║███╗██║██╔══██║██╔═══╝ ██║\r\n   ██║   ██║  ██║██║██████╔╝╚██████╔╝███████║    ╚███╔███╔╝██║  ██║██║     ██║\r\n   ╚═╝   ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝     ╚═╝\r\n                                                                              \r\n", '\x1b[0m');
let wainfo;
let SESSION_FILE_PATH = './sessions/';
const baseurl = "https://wapi.martireisen.at";
const fs = require('fs');

const { Client, Location, MessageMedia } = require('whatsapp-web.js');
var base64 = require('file-base64');
const mime = require('mime-types');
const qrcode = require('qrcode-terminal');

//Signalr initialize
const signalR = require("@microsoft/signalr");
const inquirer = require("inquirer");
const path = require("path");



//joining path of directory
const directoryPath = path.join(__dirname, "sessions");
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log("Unable to scan directory: " + err);
    }
    inquirer
        .prompt([{ type: "list", message: "Select Whatsapp Number", name: "number", choices: files }])
        .then((answers) => {
            SESSION_FILE_PATH += answers.number;
            console.log(SESSION_FILE_PATH);
            mainModule(answers.number);
        })
        .catch((error) => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else when wrong
            }
        });
});

let mainModule = (brandnumber) => {

    let connection = new signalR.HubConnectionBuilder()
        .withUrl(baseurl + "/whatsapphub?user=" + brandnumber.replace("@c.us.json", ""))
        .withAutomaticReconnect([100, 500, 1000, 5000, 7500, 10000])
        .build();

    connection.on("ReceiveMessage", (phoneNumber, message) => {
        //console.log(phoneNumber + " => " + message);
        client.sendMessage(`${phoneNumber}@c.us`, message)
    });

    connection.start()
        .then(() => console.log("SignalR Connection OK!"));
    //Signalr initialize End


    let sessionCfg;
    if (fs.existsSync(SESSION_FILE_PATH)) {
        sessionCfg = require(SESSION_FILE_PATH);
    }
    const client = new Client({ puppeteer: { headless: false, executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" }, session: sessionCfg });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
    });

    client.initialize();

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });
    client.on('ready', (info) => {
        console.log('READY ');
        wainfo = client.info;
        console.log(wainfo.me._serialized);
    });

    function ConnectionLogger(msg) {
        if (msg.to == "4319094500@c.us") {
            var date = new Date();
            var day = date.getDay();
            var hour = date.getHours();
            var kisi = "905510348088";
            var eymen = "905422821828";
            var reportnumber = '';
            if (day == 3) {
                if (hour >= 20) {
                    reportnumber = eymen;
                }
            } else {
                if (hour >= 20) {
                    reportnumber = kisi;
                }
            }
            if (reportnumber == '')
                return;
            var message = msg.from + "\r\n" + msg.body;
            client.sendMessage(reportnumber + "@c.us", message);
            return;
        }
        if (
            msg.to == "4317966840@c.us" ||
            msg.to == "4312366060@c.us"
        ) {
            var date = new Date();
            var day = date.getDay();
            var hour = date.getHours();
            var alican = "905510348088";
            var reportnumber = "436603941907";
            // reportnumber='436602221903';
            if (day >= 1 && day <= 5) {
                if (hour >= 16 && hour <= 24) {
                    reportnumber = alican;
                }
            } else if (day == 0) {
                if (hour >= 10 && hour <= 22) {
                    reportnumber = alican;
                }
            }
            var message = msg.from + "\r\n" + msg.body;
            client.sendMessage(reportnumber + "@c.us", message);
        }
    }
    client.on('message', async msg => {
        if (connection.state !== signalR.HubConnectionState.Connected) {
            await connection.start();
        }
        //  console.log('MESSAGE RECEIVED', msg);
        if (msg.from == "status@broadcast") return;
        ConnectionLogger(msg);
        var message = {
            "fromMe": msg.fromMe,
            "from": msg.from,
            "to": msg.to,
            "timestamp": msg.timestamp,
            "id": msg.id.id,
            "body": msg.body,
            "hasMedia": msg.hasMedia,
            "mediaKey": msg.mediaKey,
            "ack": msg.ack,
            "author": ""
        };
        if (msg.type == "call_log") {
            message.body = "Gelen Sesli Arama";
        }
        if (message.mediaKey == undefined)
            message.mediaKey = "";
        if (message.body == undefined)
            message.body = "";
        //  console.log(JSON.stringify(wainfo));
        //  console.log(JSON.stringify(message));
        connection.invoke("MessageIn", wainfo, message).catch(function (err) {
            console.log(err);
        });
        let contact = await msg.getContact();
        let pp = await client.getProfilePicUrl(msg.from);
        if (pp == undefined)
            pp = "";
        connection.invoke("UpdateCustomer", message, contact, pp);
        if (msg.hasMedia) {
            msg.downloadMedia().then((attachmentData) => {
                let ex = mime.extension(attachmentData.mimetype);
                let bs64 = attachmentData.data;
                base64.decode(bs64, 'c:\\vhost\\api.martireisen.at\\WpMediaFiles\\' + msg.id.id + '.' + ex, function (err, output) {
                    setTimeout(function () {
                        connection.invoke("Media", { waid: msg.id.id, mimetype: attachmentData.mimetype, extensions: ex, filename: attachmentData.filename, Length: attachmentData.data.length });
                    }, 1500);
                    console.log(output);
                });

              //  console.log({ waid: msg.id.id, mimetype: attachmentData.mimetype, extensions: ex, filename: attachmentData.filename, Length: attachmentData.data.length });

            }).catch((err) => {
                console.log(err)
            });
        }
    });
    connection.on("TryDeleteForWapi", (wanumber, cusnumber, waid) => {
        if (wainfo.me._serialized == wanumber) {
            client.getChatById(cusnumber).then(function (chat) {
                chat
                    .fetchMessages({ limit: 50 })
                    .then(function (messagelist) {
                        var index = messagelist.findIndex((e) => e.id.id == waid);
                        if (index != -1) {
                            var message = messagelist.splice(index, 1)[0];
                            message.delete(true).then(function (res) {
                                connection
                                    .invoke("MessageAck", waid, 900)
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
        }
    });
    connection.on("ReGetMessageForApi", (wanumber, cusnumber, waid) => {
        if (wainfo.me._serialized == wanumber) {
            client.getChatById(cusnumber).then(function (chat) {
                chat
                    .fetchMessages({ limit: 50 })
                    .then(function (messagelist) {
                        var index = messagelist.findIndex((e) => e.id.id == waid);
                        if (index != -1) {
                            var message = messagelist.splice(index, 1)[0];
                            connection
                                .invoke("ReGetMessage", wanumber, cusnumber, waid, message.body)
                                .catch(function (err) {
                                    console.log(err);
                                });

                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
        }
    });
    connection.on("MessageOutForWapi", (author, msg) => {
        //  console.log(author);
        //  console.log(msg);
        //
        if (wainfo.me._serialized == msg.from) {
            if (msg.to == "status@broadcast") {
                SendMessage(author, msg, true)
            } else {
                client.isRegisteredUser(msg.to).then(result => {
                    console.log(`Registered chatId: ${result}`);
                    if (result) {
                        SendMessage(author, msg, false)
                    } else {
                        var sended = {
                            ack: 0,
                            author: '',
                            body: 'Kayıtlı bir Whatsapp hesabı bulunmuyor!',
                            from: msg.from,
                            fromMe: true,
                            hasMedia: false,
                            id: (Math.floor(Math.random() * 90000) + 10000).toString(),
                            mediaKey: undefined,
                            timestamp: 1604858280,
                            to: msg.to
                        };
                        connection.invoke("MessageOut", author, sended).catch(function (err) {
                            console.log(err);
                        });
                    }
                });
            }

        }

    });


    function SendMessage(author, msg, isStatus) {
        if (msg.hasMedia) {
            var path = 'C:\\vhost\\api.martireisen.at\\WpMediaFiles\\';
            var media = MessageMedia.fromFilePath(path + msg.mediaKey);
            client.sendMessage(msg.to, media, { caption: msg.body, isStatus: isStatus }).then(function (sendedmsg) {
                media.data = "";
                var sended = {
                    "fromMe": sendedmsg.fromMe,
                    "from": sendedmsg.from,
                    "to": sendedmsg.to,
                    "timestamp": sendedmsg.timestamp,
                    "id": sendedmsg.id.id,
                    "body": sendedmsg.body,
                    "hasMedia": sendedmsg.hasMedia,
                    "mediaKey": JSON.stringify(media),
                    "ack": sendedmsg.ack,
                    "author": ""
                };
                if (sended.mediaKey == undefined)
                    sended.mediaKey = "";
                if (sended.body == undefined)
                    sended.body = "";
                //     console.log(JSON.stringify(sendedmsg));
                sendedmsg.mediaKey = msg.mediaKey;
                connection.invoke("MessageOut", author, sended).catch(function (err) {
                    console.log(err);
                });
            });;
        }
        else {
            client.sendMessage(msg.to, msg.body, { isStatus }).then(function (sendedmsg) {
                //   console.log(JSON.stringify(sendedmsg));
                var sended = {
                    "fromMe": sendedmsg.fromMe,
                    "from": sendedmsg.from,
                    "to": sendedmsg.to,
                    "timestamp": sendedmsg.timestamp,
                    "id": sendedmsg.id.id,
                    "body": sendedmsg.body,
                    "hasMedia": sendedmsg.hasMedia,
                    "mediaKey": sendedmsg.mediaKey,
                    "ack": sendedmsg.ack,
                    "author": ""
                };
                if (sended.mediaKey == undefined)
                    sended.mediaKey = "";
                if (sended.body == undefined)
                    sended.body = "";
                connection.invoke("MessageOut", author, sended).catch(function (err) {
                    console.log(err);
                });
            }).catch(function (err) {
                console.log(err);
            });
        }

    }
    client.on('message_ack', (msg, ack) => {
        connection.invoke("MessageAck", msg.id.id, ack).catch(function (eerr) {
            console.log(eerr);
        });
    });
}
