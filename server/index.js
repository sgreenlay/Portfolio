
const sqlite3 = require('sqlite3').verbose();

function dateToSQLDate(date) {
    var pad = function (num) {
        return ('00' + num).slice(-2)
    };
    return date.getUTCFullYear() + '-' +
        pad(date.getUTCMonth() + 1) + '-' +
        pad(date.getUTCDate());
}

var db = new sqlite3.Database(':memory:');

db.serialize(function () {

    db.run(`
        CREATE TABLE stocks (
            ticker TEXT,
            UNIQUE(ticker))
    `);

    var stmt = db.prepare("INSERT OR IGNORE INTO stocks VALUES (?)");
    stmt.run("MSFT");
    stmt.finalize();

    db.run(`
        CREATE TABLE stock_prices (
            ticker TEXT,
            date TEXT,
            open NUMBER,
            close NUMBER,
            high NUMBER,
            low NUMBER,
            UNIQUE(ticker, date))
    `);

    var stmt = db.prepare("INSERT OR IGNORE INTO stock_prices VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run("MSFT", dateToSQLDate(new Date()), 0, 0, 0, 0);
    stmt.run("MSFT", dateToSQLDate(new Date()), 0, 0, 0, 0);
    stmt.finalize();

    db.each("SELECT rowid AS id, ticker, date FROM stock_prices", function (err, row) {
        console.log(row.id + ": " + row.ticker + " " + row.date);
    });
});

db.close();
