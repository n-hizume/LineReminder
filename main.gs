//データ保持用スプレッドシート
const databaseSpreadsheetID = "Your SS ID";
const receivedMessageSheetName = "receivedMessage"; // 受信したメッセージをログとして記録するシート名
const remindMemberSheetName = "remindMember"; // 毎朝GoogleフォームのURLをLINEで送るメンバー
const warningMemberSheetName = "warningMember"; // 毎晩体温を提出していない時に注意のLINEを送るメンバー

//管理用スプレッドシート(≒部員名簿+その日提出した体温)
const adminSpreadsheetID = "admin spreadsheet ID";
const adminSheetName = "admin";


/*
* LINEで受信したレスポンスをスプレッドシートに書き込む
*/
function doPost(e) {  
  const ss = SpreadsheetApp.openById(databaseSpreadsheetID);
  const receivedMessageSheet = ss.getSheetByName(receivedMessageSheetName);
  const remindMemberSheet = ss.getSheetByName(remindMemberSheetName);
  const warningMemberSheet = ss.getSheetByName(warningMemberSheetName);
  
  // レスポンスを取得し、ログとして書き込む
  const response = e.postData.getDataAsString();
  receivedMessageSheet.appendRow([new Date(), response]);

  // レスポンスを解析
  const params = JSON.parse(response);
  const id = params.events[0].source.userId;
  const message = params.events[0].message.text;

  //③「希望する」という文字列が送られてきたら、
  if(message.match(/希望/)||message.match(/きぼう/)){
    // warningMemberSheetに登録されているそのユーザの名前を取得し、remindMemberSheetに登録
    const lastRow = warningMemberSheet.getLastRow();
    const idAndNames = warningMemberSheet.getRange(2,1,lastRow-1,2).getValues();
    for(var i in idAndNames){
      const id2 = idAndNames[i][0];
      if(id===id2) {
        const name = idAndNames[i][1];
        remindMemberSheet.appendRow([id, name]);
        SendMessage(id, "登録名["+name+"]で、毎朝8時頃にリマインドを送ります。");
        return;
      }
    }
  }

  //①まず名前を送ってもらい、その名前が管理用スプレッドシートに登録されているかを確認する。
  //登録されていればリマインドリストに登録, されていなければ誤字かもしれないので、もう一度送ってもらう。
  const name = message;

  const adminSheet = SpreadsheetApp.openById(adminSpreadsheetID).getSheetByName(adminSheetName);

  // 名簿の最終行を取得
  const lastRow = adminSheet.getRange(1,2).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  const names = adminSheet.getRange(2,2,lastRow-1).getValues();
  for(var i in names){
    // 名前が登録されていたら...
    // ②IDと名前をwarningMemberSheetに登録し、朝のリマインドも希望するか確認する。
    if(name===names[i][0]){
      warningMemberSheet.appendRow([id, name]);
      var message = "[ "+name+" ]で登録しました。夜9時頃までに提出がない場合にLINEでお知らせします。\n"+
                    "毎朝の体温提出のリマインドも希望する場合は、「希望する」とLINEで送ってください。\n"+
                    "毎朝8時頃に、リマインドのURLを送ります。"
      SendMessage(id,message);
      return;
    }
  }

  // 名前が登録されていなかったら...
  SendMessage(id,"名前が管理用スプレッドシートに登録されていません。もう一度送信してください。");
  return;
  
}

/*
* 毎晩実行する関数
* 管理用スプレッドシートに体温の記録があるかを確認し、なければwarningMemberSheetに登録されているユーザにLINEで注意を送る。
*/
function checkAndWarning() {
  
  const adminSheet = SpreadsheetApp.openById(adminSpreadsheetID).getSheetByName(adminSheetName);
  const warningMemberSheet = SpreadsheetApp.openById(databaseSpreadsheetID).getSheetByName(warningMemberSheetName);
  
  const adminlastRow = adminSheet.getRange(1,2).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
  const warningLastRow = warningMemberSheet.getLastRow();

  const namesAndTempFromAdmin = adminSheet.getRange(2,2,adminlastRow-1,2).getValues();
  const idAndNamesFromWarning = warningMemberSheet.getRange(2,1,lastRow-1,2).getValues();

  // 部内向けの少人数サービスなのでO(n^2)は妥協
  for(var i in idAndNamesFromWarning){
    const id = idAndNamesFromWarning[i][0];
    const name = idAndNamesFromWarning[i][1];
    for(var j in namesAndTempFromAdmin){
      // adminの体温の欄が空欄なら、ユーザにLINEで注意を送る。
      if(name===namesAndTempFromAdmin[j][0] && namesAndTempFromAdmin[j][1]!==""){
        SendMessage(id, name+"さん、体温を提出してください。");
        break
      }
    }
  }
    
}

/*
* 毎朝実行する関数
* remindMemberSheetに登録されているユーザにLINEでリマインドを送る。
*/
function remind(){
  const remindMemberSheet = SpreadsheetApp.openById(databaseSpreadsheetID).getSheetByName(remindMemberSheetName);
  const lastRow = remindMemberSheet.getLastRow();
  const idAndNames = remindMemberSheet.getRange(2,1,lastRow-1,2).getValues();

  for(var i in idAndNames){
    const id = idAndNames[i][0];
    const name = idAndNames[i][1];
    const params = {
      url: "google form url",
      entries: [
        ["123456789", name],
      ]
    SendMessage(id, createRemindMessage(params));
  }
}


function createRemindMessage(params){
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayofweek = date.getDay();
  const dayname = ["日","月","火","水","木","金","土"];

  const todayStr = month + "月" + day + "日(" + dayname[dayofweek] + ")";
  var url = params.url;
  for (i in params.entries) {
    const entryCode = params.entries[i][0];
    const entryData = params.entries[i][1];
    url += "&entry." + entryCode + "=" + entryData;
  }
  return todayStr + "\n" + "本日も体温を提出してください。\n" + url + "\n";
  
}





