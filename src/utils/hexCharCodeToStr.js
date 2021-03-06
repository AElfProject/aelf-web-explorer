/**
 * @file hexCharCodeToStr.js
 * @author zhouminghui
 * 16进制转字符
 */

export default function hexCharCodeToStr(hexCharCodeStr) {
    if (typeof hexCharCodeStr !== 'string' || hexCharCodeStr.length % 2 !== 0) {
        throw Error('invalid input');
    }
    let trimedStr = hexCharCodeStr.trim();
    let rawStr = trimedStr.substr(0, 2).toLowerCase() === '0x' ? trimedStr.substr(2) : trimedStr;
    let len = rawStr.length;
    if (len % 2 !== 0) {
        throw Error('Illegal Format ASCII Code!');
    }
    let curCharCode;
    let resultStr = [];
    for (let i = 0; i < len; i = i + 2) {
        curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
        resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join('');
}
