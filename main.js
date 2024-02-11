 
// Замени #123 на свой токен бота в TG
const token = "#123";

// Замени #1234 на ссылку задеплоенного приложения
const App_link = "https://script.google.com/macros/s/#1234/exec";

function getAnswerID(el) {
    return el.split('/',1).join('') }

function api_connector () {
  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/setWebHook?url="+App_link); }

const doc = SpreadsheetApp.getActive();
const questionsSheet = doc.getSheetByName("Questions");
const answersSheet = doc.getSheetByName("Answers");
const usersSheet = doc.getSheetByName("Users");

function doPost(e) {
  const update = JSON.parse(e.postData.contents);
  let msgData = {}
  if (update.hasOwnProperty('message')) {
    msgData = {
      id         : update.message.message_id,
      chat_id    : update.message.chat.id,
      user_name  : update.message.from.username,
      text       : update.message.text,
      date       : (update.message.date/86400)+25569.125,
      is_msg     : true
    };
  } else if (update.hasOwnProperty('callback_query')) {
    msgData = {
      id         : update.callback_query.message.message_id,
      chat_id    : update.callback_query.message.chat.id,
      user_name  : update.callback_query.from.username,
      first_name : update.callback_query.from.first_name,
      text       : update.callback_query.message.text,
      date       : (update.callback_query.message.date/86400)+25569.125,
      data       : update.callback_query.data,
      is_button  : true
    }
  }
  // sendQuestions(msgData.chat_id);
  dataHandler(msgData)
}

function dataHandler(msgData) {
  if (msgData.is_msg) {
    sendQuestions(msgData.chat_id);
  } else if (msgData.is_button) {
    saveData(msgData)
    editMessage(msgData) 
  }
}

function saveData(msgData)  {
  const vals = [msgData.chat_id, msgData.user_name, getAnswerID(msgData.text), msgData.data, msgData.date]
  usersSheet.appendRow(vals)
}

function send(msg, chat_id, keyboard) {
  const payload = {
    'method': 'sendMessage',
    'chat_id': String(chat_id),
    'text': msg,
    'parse_mode': 'HTML',
    'reply_markup' : JSON.stringify(keyboard)
  }
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  }
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}


function sendQuestions(chat_id) {
    const Questions = questionsSheet.getDataRange().getValues();
  
    const randomQuestion = Questions[Math.floor(Math.random() * Questions.length)];

    const answersArr = answersSheet.getDataRange().getValues().filter(e => e[0] == randomQuestion[0]);
    let arr = answersArr.map(el => [{"text":el[1], "callback_data":el[1]}]);
    const keyboard = {"inline_keyboard": arr};
    const question = randomQuestion[0] + '/' + Questions.length + ': ' + randomQuestion[1];

    send(question, chat_id, keyboard);
}

function editMsg(msg, chat_id, msg_id, keyboard) {
  const payload = {
    'method': 'editMessageText',
    'chat_id': String(chat_id),
    'message_id': String(msg_id),
    'text': msg,
    'parse_mode': 'HTML'
  }
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard)
  
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  }
  
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}


function editMessage(msgData) {
    // const answersArr = answersSheet.getDataRange().getValues().filter(e => e[0] == msgData.text[0]);
    const answersArr = answersSheet.getDataRange().getValues().filter(e => e[0] == getAnswerID(msgData.text));
    const curAnswerArr = answersArr.find(e => e[1] == msgData.data);

    let newText = new String();
    if (curAnswerArr[2]) newText = msgData.text + '\nТвой ответ: ' + msgData.data + ' ✅';
    else newText = msgData.text + '\nТвой ответ: ' + msgData.data + ' ❌';

    editMsg(newText, msgData.chat_id, msgData.id, null);

    // After answering, send the next random question
    sendQuestions(msgData.chat_id);
}

function transformArr(arr) {
  //create 2D array with just 1 row and m columns
    var dataRow = new Array(1);
    dataRow[0] = new Array(arr.length);
  //fill it with values
    for(var j=0;j<arr.length;j++){
        dataRow[0][j]=arr[j];
    }
    return dataRow;
}

//////////////////////////////////////////////////////////////////////////////////////////////
///  Generate Questions and Checks


function generateWords() {
  var doc = SpreadsheetApp.getActive();
  var sheet = doc.getSheetByName("Words");
  // var dataRange = sheet.getRange("D1:D20");
  var dataRange = getDataRange(sheet,"D")
  var data = dataRange.getValues();
  var output = [];

  for (var i = 0; i < data.length; i++) {
    var word = data[i][0];
    if (word != "") {
      var otherWords = getOtherRandomWords(data, i, 3); // Получаем 3 случайных слова
      var result = [word].concat(otherWords)
      result.sort(() => Math.random() - 0.5); // Перемешиваем массив 
      output.push(result); // Добавляем текущее слово и другие случайные слова в массив
    }
  }

  var columnData = [];

  // Итерируемся по каждому внутреннему массиву
  for (var i = 0; i < output.length; i++) {
    var innerArray = output[i];
    // Итерируемся по каждому элементу внутреннего массива
    for (var j = 0; j < innerArray.length; j++) {
      columnData.push([innerArray[j]]);
    }
  }

  // Записываем данные в столбец B начиная с ячейки B1
  sheet.getRange(1, 5, columnData.length, 1).setValues(columnData);
  findAndMark();
  setId();
}


function getOtherRandomWords(data, index, count) {
  var words = [];
  for (var i = 0; i < data.length; i++) {
    if (i !== index && data[i][0] !== "") {
      words.push(data[i][0]);
    }
  }
  words.sort(() => Math.random() - 0.5); // Перемешиваем массив
  return words.slice(0, count); // Выбираем указанное количество случайных слов
}

function findAndMark() {
  var doc = SpreadsheetApp.getActive();
  var sheet = doc.getSheetByName("Words");
  // var dataRange1 = sheet.getRange("D1:D20"); 
  // var dataRange2 = sheet.getRange("E1:E80"); 
  var dataRange1 = getDataRange(sheet,"D"); 
  var dataRange2 = getDataRange(sheet,"E");
    
  var data1 = dataRange1.getValues();
  var data2 = dataRange2.getValues();

  data1 = data1.filter(function(subarray) {
    // Возвращаем true, если подмассив не содержит только пустые строки
    return subarray.some(function(value) {
      return value !== '';
    });
  });
  data2 = data2.filter(function(subarray) {
    // Возвращаем true, если подмассив не содержит только пустые строки
    return subarray.some(function(value) {
      return value !== '';
    });
  });


  for (var i = 0; i < data1.length; i++) {
    var wordFromFirstColumn = data1[i][0];
    for (var j = 0+4*i; j < 4+4*i; j++) {
      if (data2[j][0] === wordFromFirstColumn) {
        sheet.getRange(j + 1, 6).setValue("TRUE"); // Помечаем TRUE в соседнем справа столбце
        break;
      }
    }
  }
}

function setId() {
  var doc = SpreadsheetApp.getActive();
  var sheet = doc.getSheetByName("Words");
  // var dataRange = sheet.getRange("E1:E80"); 
  var dataRange = getDataRange(sheet,"E");
  var data = dataRange.getValues();

  for (var i = 0; i < data.length; i++) {
      sheet.getRange(i + 1, 7).setValue(blockNumber(i + 1));
  }
}

function blockNumber(num) {
  // Вычисляем номер блока, в котором находится число
  return Math.ceil(num / 4);
}

function getDataRange(sheet, column) {
  var lastRow = sheet.getLastRow(); // Получаем номер последней заполненной строки в столбце
  var dataRange = sheet.getRange(column + "1:" + column + lastRow); // Формируем диапазон
  return dataRange;
}
