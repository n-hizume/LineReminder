const CHANNEL_ACCESS_TOKEN = "Your LINE Access Token";
const URL = "https://api.line.me/v2/bot/message/push";
const HEADERS = {
  "Content-Type": "application/json",
  'Authorization': "Bearer " + CHANNEL_ACCESS_TOKEN,
};

/*
*  ユーザにLINEでメッセージを送信する
*/ 
function SendMessage(userId, message) {
    const postData = {
      "to": userId,
      "messages": [{
        "type": "text",
        "text": message,
      }]
    };
    
    const options = {
      "method": "post",
      "headers": HEADERS,
      "payload": JSON.stringify(postData), 
    };

    const response = UrlFetchApp.fetch(URL, options);
    return response;    
}