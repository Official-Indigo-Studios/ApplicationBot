const { discord, config } = require('./index.js');
const mysql = require('mysql');
const appTable = 'applications';

module.exports = {
    load() {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            console.log('Database connected succesfully!');

            var sql = `SELECT * FROM ${appTable}`;

            connection.query(sql, (err, result, fields) => {
                if (err) throw err;

                var appManager = require('./appmanager.js');
                var { client } = require('./index.js');
                result.forEach((value) => {
                    var isTicket;
                    if (value.is_ticket) {
                        isTicket = 'ticket';
                    }
                    var channel = client.channels.cache.get(value.channel_id);
                    var questions = value.questions.split('|');
                    appManager.buildApp(value.name, channel, questions, isTicket, false);
                });
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
            var questions = app.questions.join('|');
            var sql = `INSERT INTO ${appTable} (name, channel_id, questions, is_ticket, guild_id) VALUES ('${app.name}', ${app.submission_channel.id}, '${questions}', ${isTicket}, ${app.submission_channel.guild.id})`;
            connection.query(sql, (err, result) => {
                if (err) throw err;

                console.log('Record inserted.');
            });
        });
    },

    delete(app) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            var isTicket = 0;
            if (app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `DELETE FROM ${appTable} WHERE name = '${app.name}' AND is_ticket = ${isTicket} AND guild_id = '${app.submission_channel.guild.id}'`;
            connection.query(sql, (err, result) => {
                if (err) throw err;

                console.log('Record removed.');
            });
        });
    }
}