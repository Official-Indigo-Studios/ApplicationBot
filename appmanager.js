const { client, discord, config } = require('./index.js');
const mysql = require('mysql');

// Maps guild to list of application that the guild has
client.apps = new discord.Collection();
// Maps a Discord user to their app response. They can only work on one app at a time
client.responses = new discord.Collection();
client.ticketResponses = new discord.Collection();

module.exports = {

    getApps(guild) {
        return client.apps.get(guild);
    },

    getApp(guild, name, isTicket) {
        return this.getApps(guild).find((value) => {
            if (isTicket) {
                if (value.type === 'ticket') {
                    return value.name == name;
                }
            } else {
                if (value.type !== 'ticket') {
                    return value.name == name;
                }
            }
        });
    },

    getOpenApp(user, isTicket) {
        if (!isTicket) {
            return client.responses.get(user);
        } else {
            return client.ticketResponses.get(user);
        }
    },

    getOwner(application) {
        var responses = client.responses;
        if (application.app.type == 'ticket') {
            responses = client.ticketResponses;
        }
        var applicant = responses.findKey((listApp) => {
            if (listApp == application) {
                return true;
            }
        });
        return applicant;
    },

    findTicketByChannel(channel) {
        return client.ticketResponses.find((openApp) => {
            if (openApp.channel == channel) {
                return true;
            }
        });
    },

    findTicketByID(id) {
        return client.ticketResponses.find((openApp) => {
            if (openApp.id == id) {
                return true;
            }
        });
    },

    addAuthorisedRole(app, role) {
        if (app.roles != undefined) {
            app.roles.push(role);
        } else {
            app.roles = [role];
        }
    },

    startApp(applicant, application) {
        // Regular app
        if (application.type != 'ticket') {
            client.responses.set(applicant, {
                app: application,
                responses: []
            });
        } else { // Ticket
            client.ticketResponses.set(applicant, {
                app: application,
                responses: [],
            });
        }
    },

    addResponse(applicant, isTicket, response) {
        var openApp = this.getOpenApp(applicant, isTicket);
        var responses = openApp.responses;
        responses[responses.length] = response;
        openApp.responses = responses;
        if (!isTicket) {
            client.responses.set(applicant, openApp);
        } else {
            client.ticketResponses.set(applicant, openApp);
        }
    },

    numResponsesNeeded(applicant, isTicket) {
        var openApp = this.getOpenApp(applicant, isTicket);
        var questionAmount = openApp.app.questions.length;
        var responseAmount = openApp.responses.length;
        return questionAmount - responseAmount;
    },

    finishApp(applicant, sendIn, isTicket) {
        if (sendIn) {
            var openApp = this.getOpenApp(applicant, isTicket);
            if (!isTicket) {
                var formattedResponses = openApp.responses.map((value, index) => {
                    return `**${openApp.app.questions[index]}**: ${value}`;
                });
                formattedResponses.unshift(`**Discord**: ${this.getOwner(openApp)}`);
                openApp.app.submission_channel.send(formattedResponses);
            } else {
                var id = client.ticketResponses.reduce((accumulator, currentValue) => {
                    if (currentValue.id != undefined) {
                        if (accumulator < currentValue.id) {
                            return currentValue.id;
                        }
                    } else {
                        return accumulator;
                    }
                }, -1);
                id = id + 1;
                var perms;
                if (openApp.app.roles != undefined) {
                    perms = openApp.app.roles.map((value) => {
                        return {id: value.id,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                                }
                    });
                }
                var channel = openApp.app.submission_channel.guild.channels.create(`${id}`, {
                    parent: openApp.app.submission_channel,
                    permissionOverwrites: perms
                });
                channel.then((channel) => {
                    openApp.channel = channel;
                    openApp.id = id;
                    var formattedResponses = openApp.responses.map((value, index) => {
                        return `**${openApp.app.questions[index]}**: ${value}`;
                    });
                    formattedResponses.unshift(`**Discord**: ${this.getOwner(openApp)}`);
                    channel.send(formattedResponses);
                });
            }
        }
    },

    closeTicket(ticket) {
        ticket.channel.delete();
        var applicant = this.getOwner(ticket);
        client.ticketResponses.delete(applicant);
    },

    buildApp(name, submissionChannel, questions, isTicket) {
        var app = {
            name: name,
            submission_channel: submissionChannel,
            questions: questions
        };
        if (isTicket) {
            app.type = 'ticket';
        }
        if (client.apps.has(submissionChannel.guild)) {
            var apps = this.getApps(submissionChannel.guild);
            apps[apps.length] = app;
            client.apps.set(submissionChannel.guild, apps);
        } else {
            client.apps.set(submissionChannel.guild, [app]);
        }
    },

    load() {
        var connection = mysql.createConnection(config.database);
        connection.connect((error) => {
            if (error) throw error;
            console.log('Connected!');
        })
    }
}