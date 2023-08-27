/**
 * @typedef {Map<string, string>} UserInfoMap key: ユーザのLINE ID, value: ユーザの名前
 */

/**
 * 体温提出シートから、ユーザ名と体温提出済みかどうかを取得
 * @return {Map<string, bool>} key: ユーザの名前, value: 体温提出済みかどうか
 */
function getUserSubmittedMapFromTempSheet() {
  const sheet =
    SpreadsheetApp.openById(TEMP_SS_ID).getSheetByName(TEMP_SS_SHEET_NAME); //シートの読み込み

  const lastRow = sheet.getLastRow(); //シートのデータが存在する最終行を取得
  const values = sheet.getRange(2, 2, lastRow - 1, 3).getValues(); //シートのデータを二次元配列で取得

  const userSubmittedMap = new Map();

  for (let i = 0; i < values.length; i++) {
    const name = values[i][0];
    if (name === "") break;
    const temp = values[i][2];
    userSubmittedMap.set(name, temp !== "");
  }

  return userSubmittedMap;
}

/**
 * 未提出警告用シートのユーザ情報を取得
 * @returns {UserInfoMap}
 */
function getUserInfoMapFromRemindSheet() {
  const userInfoMap = getUserInfoMapFromUserTableSheet_(
    LINE_SS_REMIND_SHEET_NAME
  );
  return userInfoMap;
}

/**
 * フォームURL送信用シートのユーザ情報を取得
 * @returns {UserInfoMap}
 */
function getUserInfoMapFromSendFormSheet() {
  const userInfoMap = getUserInfoMapFromUserTableSheet_(
    LINE_SS_SENDFORM_SHEET_NAME
  );
  return userInfoMap;
}

/**
 * シート名を引数に受け取り、そのシートに書かれたユーザ情報を返す関数
 * @param sheetName
 * @returns {UserInfoMap}
 */
function getUserInfoMapFromUserTableSheet_(sheetName) {
  const sheet = SpreadsheetApp.openById(LINE_SS_ID).getSheetByName(sheetName); //シートの読み込み
  const lastRow = sheet.getLastRow(); //シートのデータが存在する最終行を取得
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); //シートのデータを二次元配列で取得

  const userInfoMap = new Map();
  for (let i = 0; i < values.length; i++) {
    const name = values[i][0];
    const lineId = values[i][1];
    userInfoMap.set(lineId, name);
  }

  return userInfoMap;
}

/**
 * 未提出警告用シートにユーザを追加
 * @param {string} userLineId ユーザのLINE ID
 * @param {string} userName ユーザの名前
 * @throws {AlreadyExistError} 既にユーザが登録されている場合
 */
function putUserInfoToRemindSheet(userLineId, userName) {
  const remindUserMap = getUserInfoMapFromRemindSheet();
  if (remindUserMap.has(userLineId)) {
    throw new AlreadyExistError(`userLineId "${userLineId}" is already exist.`);
  }
  putDataToSheet_(LINE_SS_REMIND_SHEET_NAME, [userName, userLineId]);
}

/**
 * フォームURL送信用シートにユーザを追加
 * @param {string} userLineId ユーザのLINE ID
 * @param {string} userName ユーザの名前
 * @throws {AlreadyExistError} 既にユーザが登録されている場合
 */
function putUserInfoToSendFormSheet(userLineId, userName) {
  const sendFormUserMap = getUserInfoMapFromSendFormSheet();
  if (sendFormUserMap.has(userLineId)) {
    throw new AlreadyExistError(`userLineId "${userLineId}" is already exist.`);
  }
  putDataToSheet_(LINE_SS_SENDFORM_SHEET_NAME, [userName, userLineId]);
}

/**
 * ログを書き込む
 * @param {string} data 書き込むデータ
 */
function putDataToLogSheet(data) {
  putDataToSheet_(LINE_SS_LOG_SHEET_NAME, [new Date(), data]);
}

/**
 * シート名を引数に受け取り、そのシートにテータを一行追加する
 * @param {string} sheetName シート名
 * @param {Array} dataRow 追加するデータ
 */
function putDataToSheet_(sheetName, dataRow) {
  const sheet = SpreadsheetApp.openById(LINE_SS_ID).getSheetByName(sheetName); //シートの読み込み
  sheet.appendRow(dataRow);
}
