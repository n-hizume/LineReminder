/**
 * LINE APIのWebhookからのリクエストを受け取る関数
 * @param {string} e LINE APIから受け取るデータ
 * @returns {Promise<void>}
 */
async function doPost(e) {
  // レスポンスを取得し、ログとして書き込む
  const response = e.postData.getDataAsString();
  putDataToLogSheet(response);

  // レスポンスを解析
  const params = JSON.parse(response);
  const userLineId = params.events[0].source.userId;
  const message = params.events[0].message.text;

  const remindUserMap = getUserInfoMapFromRemindSheet();

  // リマインド未登録の場合(初期状態: State1)
  if (!remindUserMap.has(userLineId)) {
    await doPostWhenState1_(userLineId, message);
  }
  // リマインド登録済 & フォーム送信未登録の場合(State2)
  else if (!getUserInfoMapFromSendFormSheet().has(userLineId)) {
    const userName = remindUserMap.get(userLineId);
    await doPostWhenState2_(userLineId, userName, message);
  }
  // リマインド登録済 & フォーム送信済の場合(State3)
  else {
    await doPostWhenState3_(userLineId, message);
  }
}

/**
 * リマインド未登録のユーザの場合、送られてきたメッセージ(ユーザ名を想定)が管理シートに存在するか確認
 *  - 存在する場合、リマインド未登録のユーザとして登録し、その旨をLINEで送信 + 毎朝のフォーム送信を希望するか聞く
 *  - 存在しない場合、もう一度送信してくださいとLINEで送信
 * @param userLineId
 * @param message
 */
async function doPostWhenState1_(userLineId, message) {
  // 存在するユーザ名か確認
  if (getUserSubmittedMapFromTempSheet().has(message)) {
    const userName = message;
    // リマインド未登録の場合登録し、その旨をLINEで送信
    putUserInfoToRemindSheet(userLineId, userName);
    const message =
      userName +
      "さんを登録しました。夜9時頃までに提出がない場合にLINEでお知らせします。\n" +
      "毎朝の体温提出フォームの送信も希望する場合は、「希望する」とLINEで送ってください。\n" +
      "毎朝8時頃に、体温提出フォームのURLを送ります。";
    await sendMessage(userLineId, message);
  } else {
    await sendMessage(
      userLineId,
      "名前が管理シートに存在しません。もう一度送信してください。"
    );
  }
}

/**
 * リマインド登録済 & フォーム送信未登録のユーザの場合、送られてきたメッセージが「希望する」か確認
 *  - 「希望する」の場合、フォーム送信未登録のユーザとして登録し、その旨をLINEで送信
 *  - 「希望する」以外の場合、希望する場合その旨を送信してくださいとLINEで送信
 * @param userLineId
 * @param userName
 * @param message
 */
async function doPostWhenState2_(userLineId, userName, message) {
  if (message.match(/希望する/) || message.match(/きぼうする/)) {
    putUserInfoToSendFormSheet(userLineId, userName);
    await sendMessage(
      userLineId,
      `${userName}さんに、毎朝8時頃に体温提出フォームを送ります。`
    );
  } else {
    await sendMessage(
      userLineId,
      "毎朝の体温提出フォームの送信を希望する場合は、「希望する」と送ってください。"
    );
  }
}

/**
 * リマインド登録済 & フォーム送信済のユーザの場合、何も返さないとエラーを疑われるのでおうむがえしする
 * @param userLineId
 * @param message
 */
async function doPostWhenState3_(userLineId, message) {
  await sendMessage(userLineId, message);
}
