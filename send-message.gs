const URL = "https://api.line.me/v2/bot/message/push";
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + CHANNEL_ACCESS_TOKEN,
};

/**
 * ユーザにLINEでメッセージを送信する
 * @param {string} userId ユーザのLINE ID
 * @param {string} message 送信するメッセージ
 * @returns {Promise<Object>} LINE APIのresponse
 * @throws {LineTransmissionError} LINE APIのresponseが200以外の場合
 */
async function sendMessage(userId, message) {
  const postData = {
    to: userId,
    messages: [
      {
        type: "text",
        text: message,
      },
    ],
  };

  const options = {
    method: "post",
    headers: HEADERS,
    payload: JSON.stringify(postData),
  };

  const response = UrlFetchApp.fetch(URL, options);
  if (response.getResponseCode() !== 200) {
    throw new LineTransmissionError(response.getContentText());
  }
}
