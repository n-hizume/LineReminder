/**
 * 毎晩実行する関数。管理用スプレッドシートに体温の記録があるかを確認し、なければwarningMemberSheetに登録されているユーザにLINEで注意を送る。
 */
async function remind() {
  const userTempMap = getUserSubmittedMapFromTempSheet();
  const remindUserMap = getUserInfoMapFromRemindSheet();

  // for (let [userLineId, userName] of remindUserMap) {
  //   if (!userTempMap.has(userName)) {
  //     await sendMessage(userLineId, `${userName}さん、体温を提出してください。`);
  //   }
  // }

  await Promise.all(
    Array.from(remindUserMap).map(async ([userLineId, userName]) => {
      if (!userTempMap.has(userName)) {
        await sendMessage(
          userLineId,
          `${userName}さん、体温を提出してください。`
        ).catch((error) => putDataToLogSheet(error.message));
      }
    })
  );
}

/**
 *  毎朝実行する関数。remindMemberSheetに登録されているユーザにLINEでリマインドを送る。
 */
async function sendForm() {
  const userTempMap = getUserSubmittedMapFromTempSheet();
  const sendFormUserMap = getUserInfoMapFromSendFormSheet();

  const generateMessage = function (userName) {
    const date = new Date();
    const dayname = ["日", "月", "火", "水", "木", "金", "土"];
    const todayStr = `${date.getMonth() + 1}月${date.getDate()}日(${
      dayname[date.getDay()]
    })`;
    const params = {
      123456789: userName,
    };
    let url = GOOGLE_FORM_URL;
    for (entryCode in params) {
      url += `&entry.${entryCode}=${params[entryCode]}`;
    }
    return todayStr + "\n" + "本日も体温を提出してください。\n" + url + "\n";
  };

  await Promise.all(
    Array.from(sendFormUserMap).map(async ([userLineId, userName]) => {
      if (!userTempMap.has(userName)) {
        await sendMessage(userLineId, generateMessage(userName)).catch(
          (error) => putDataToLogSheet(error.message)
        );
      }
    })
  );
}
