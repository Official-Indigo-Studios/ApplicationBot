const { discord, config } = require('./index.js');
const mysql = require('mysql');
const appTable = 'applications';
const responseTable = 'responses';

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
    },

    saveResponses(response, status) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;

            var appManager = require('./appmanager.js');
            var { client } = require('./index.js');

            var applicantID = appManager.getOwner(response).id;
            var responses = response.responses.join('|');
            var isTicket = 0;
            if (response.app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `SELECT id FROM ${appTable} WHERE name = '${response.app.name}' AND channel_id = '${response.app.submission_channel.id}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;

                var appID = result[0].id;
                sql = `INSERT INTO ${responseTable} (user_id, app_id, responses, status) VALUES ('${applicantID}', ${appID}, '${responses}', ${status})`;
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log('Response saved.');
                });
            });
        });
    },

    loadResponse(userID, guildID, appName, isTicket) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;

            var sql = `SELECT id FROM ${appTable} WHERE name = '${appName}' AND guild_id = '${guildID}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;

                var appID = result[0].id;
                sql = `SELECT responses FROM ${responseTable} WHERE user_id = '${userID}' AND app_id = ${appID}`;
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log(result[0].responses);
                });
            });
        });
    },

    setResponseStatus(openApp, status) {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;

            var isTicket = 0;
            if (openApp.app.type === 'ticket') {
                isTicket = 1;
            }
            var sql = `SELECT id FROM ${appTable} WHERE name = '${openApp.app.name}' AND channel_id = '${openApp.app.submission_channel.id}' AND is_ticket = ${isTicket}`;
            connection.query(sql, (error, result) => {
                if (error) throw error;
                var appManager = require('./appmanager.js');
                var id = result[0].id;
                sql = `UPDATE ${responseTable} SET status = ${status} WHERE user_id = '${appManager.getOwner(openApp).id}' AND app_id = ${id} AND responses = '${openApp.responses.join('|')}'`;
                connection.query(sql, (error, result) => {
                    if (error) throw error;

                    console.log('Status updated.');
                });
            });
        });
    }
}