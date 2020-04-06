const { client, discord, config } = require('./index.js');
const mysql = require('mysql');
const appTable = 'applications'

module.exports = {
    load() {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            console.log('Database connected succesfully!');

            connection.query(`SELECT * FROM ${appTable}`, (err, result, fields) => {
                if (err) throw err;

                console.log(result);
            });
        });
    },

    add(app) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            var isTicket = 0;
            if (app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `INSERT INTO ${appTable} (name, channel_id, questions, is_ticket, guild_id) VALUES ('${app.name}', ${app.submission_channel.id}, '${app.questions}', ${isTicket}, ${app.submission_channel.guild.id})`;
            connection.query(sql, (err, result) => {
                if (err) throw err;

                console.log('Record inserted.');
            });
        });
    }
}