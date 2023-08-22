var crypto = require('crypto');


function createSignature(timestamp, apiKey, apiSecret){
    var hmac = crypto.createHmac('sha256', apiSecret );
    hmac.update( timestamp + apiKey );
    return hmac.digest('hex');
}

function createAuthRequest(apiKey, apiSecret ){
    var timestamp = Math.floor(Date.now() / 1000);  // Note: java and javascript timestamp presented in miliseconds
    var args = { e: 'auth', auth: { key: apiKey, 
        signature: createSignature(timestamp, apiKey, apiSecret), timestamp: timestamp } };
    var authMessage = JSON.stringify( args );
    return authMessage;
}
async function readJsonn(configFile) {
    const auth = await JSON.stringify(configFile) ;
    // console.log(auth)
    return auth
}
module.exports = {createSignature,createAuthRequest,readJsonn}