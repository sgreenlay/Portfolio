// https://stackoverflow.com/a/12785546/169021
function csvToTable(str, reviver) {
    reviver = reviver || function (r, c, v) { return v; };
    var chars = str.split(''), c = 0, cc = chars.length, start, end, table = [], row;
    while (c < cc) {
        table.push(row = []);
        while (c < cc && '\r' !== chars[c] && '\n' !== chars[c]) {
            start = end = c;
            if ('"' === chars[c]) {
                start = end = ++c;
                while (c < cc) {
                    if ('"' === chars[c]) {
                        if ('"' !== chars[c + 1]) { break; }
                        else { chars[++c] = ''; } // unescape ""
                    }
                    end = ++c;
                }
                if ('"' === chars[c]) { ++c; }
                while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) { ++c; }
            } else {
                while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) { end = ++c; }
            }
            row.push(reviver(table.length - 1, row.length, chars.slice(start, end).join('')));
            if (',' === chars[c]) { ++c; }
        }
        if ('\r' === chars[c]) { ++c; }
        if ('\n' === chars[c]) { ++c; }
    }
    return table;
}

export function parseCSV(str) {
    var table = csvToTable(str);
    var header = table[0];

    var arr = new Array();
    for (var i = 1; i < table.length; ++i) {
        var object = new Object();
        for (var j = 0; j < table[i].length; ++j) {
            object[header[j]] = table[i][j];
        }
        arr.push(object);
    }
    return arr;
};