// Services
const httpSrv = require ('http');
const fileSrv = require ('fs');
const urlSrv = require ('url-parse');

// constants
// const defaultHtmlFile = 'submitChat-Using-url-parse.html';
// const defaultCSSFile = 'submitChat-Using-url-parse.css';
const defaultHtmlFile = 'chatForm-url-parse.html';
const defaultCSSFile = 'chatForm-url-parse.css';
const msgHistoryFile = 'message-history.json';
const activePort = 8080;
let reqCounter=0;

console.clear();
console.log (`STARTING SERVER .......... port: ${activePort}`);

httpSrv.createServer ( (request, response) => {
    // Skip "garbage"
    if ( request.url === '/favicon.ico' ) {
        // console.log (`DEBUG skip  .....request.url:  ${request.url}`);    
        return ;
    }

    // Debug
    console.log (`\n\nREQUEST # ${++reqCounter} RECEIVED ........................`);
    console.log (`DEBUG        request.url:  ${request.url}`);

    // load the css file. Note this is generated in a separate call
    // so for each F5 we see in as debug TWO "REQUEST #N RECEIVED"
    if ( request.url === ('/'+defaultCSSFile) ) {
        let cssFile = fileSrv.readFileSync (defaultCSSFile, {encoding: 'utf-8'});
        response.writeHead ( 200, {'Content-type': 'text/css'});
        response.write (cssFile);
        response.end();
        console.log (`DEBUG     loaded CSS file`);    
        return 
    }

    const reqURL = new urlSrv(request.url, true);
    
    // Delete all Hisotry Messages 
    if ( parseInt(request.url.search('delMessage')) >= 0 ) {
        console.log ('REQUEST TO DELETE Hitory Message ....');
        // Just need to create a new file with [] and all is ok.
        fileSrv.writeFileSync (msgHistoryFile, JSON.stringify( [] ));
    }

    // load messages history file and convert it to an Array.
    let msgHistoryArray = loadJSONFile () ;

    
    const nickName = reqURL.query.nickName || ''; // must use the OR || '' otherwise we get "undefined"
    const message = reqURL.query.message || '';
    console.log (`reqURL.query.fieldName  nick: ${nickName} msg: ${message}`);
    if (nickName !== '' && message !== '') {
        // now that we have valid data we can push new Message to the Array
        console.log ('pushing new element into Array');
        msgHistoryArray.push ( {"nickName": nickName, "message": message, "time": getTime() } );

        // update the JSON file for next read. Use the updated Array
        fileSrv.writeFileSync (msgHistoryFile, JSON.stringify (msgHistoryArray));
        getTime();
    }
    // read the HTML original HTML File
    // console.log ('reading HTML file');
    let mainPage = fileSrv.readFileSync (defaultHtmlFile, {encoding: 'utf-8'});


    // update main HTML with number of messages so far
    mainPage = mainPage.replace ('###CountMessages###' , msgHistoryArray.length ) ; 

    // update main HTML with the History of Messages, each message in 1 div with dedciated class
    let msgHistoryContent='';

    if (msgHistoryArray.length) {
        msgHistoryArray.forEach( (element, idx) => {
            msgHistoryContent += 
            `<div class="oneMessageDiv"> 
                <strong class="oneMessageStrong">${element.nickName}:</strong>
                <label class="oneMessageTime">At: ${element.time}  </label>
                ${element.message}
            </div>`
        });

        // console.log ('msg for HTML\n ' + msgHistoryContent); 
    } 
    
    
   // insert message history to main HTML
    mainPage = mainPage.replace ('###MessageHistory###' , msgHistoryContent ) ; 
    
    
    // load the final "update" html file to DOM
    response.writeHead (200, {'Content-type': 'text/html'});
    // the HTML page after we replaced / updated all relevant sections
    response.write(mainPage);
    response.end();
}).listen(activePort)

function loadJSONFile () {
    let msgHistoryArray ='';
    try {
        msgHistoryArray = JSON.parse (fileSrv.readFileSync (msgHistoryFile, {encoding: 'utf-8'}));
    }
    catch (e) {
        if (e.code==="ENOENT") {
            console.log (`loadJSONFile():   file not found (error code=${e.code}). valid scenario return empty array`);
            msgHistoryArray=[];
        } else {
            console.log ('loadJSONFile():   ERROR Text='+e);
            msgHistoryArray=[];
        }
    } // END catch

    return msgHistoryArray;
} // END loadJSONFile()

function getTime() {
    let time = new Date();
    let timeInUIFormat = 
        dateZeroPrefix (time.getDate().toString(), 2) + '-' +
        getMonthName (time.getMonth()) + '-' + time.getFullYear() + '  ' +
        dateZeroPrefix ( time.getHours().toString(), 2 ) + ":" + 
        dateZeroPrefix ( time.getMinutes().toString(), 2)  + ":" + 
        dateZeroPrefix ( time.getSeconds().toString(), 2 );

    // console.log ('getTime(): ' + timeInUIFormat);
 
    return timeInUIFormat;
}

function getMonthName (pMonthEnum) {
    monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // console.log ('getMonthName - ' + monthNames[pMonthEnum]);
    return (monthNames[pMonthEnum]);
}

function dateZeroPrefix (pOrgString, pRequiredLength) {
    let prefix = '0';
    // console.log(pOrgString + '--'+ pRequiredLength);
    while (pOrgString.length < parseInt(pRequiredLength)) {
        pOrgString = prefix + pOrgString;
    }
    return pOrgString;
}