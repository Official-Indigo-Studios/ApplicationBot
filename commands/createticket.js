const { discord, client } = require('../index.js');
const appManager = require('../appmanager.js');

module.exports = {
    name: 'createticket',
    description: 'Create tickets',

    execute(message, args) {
        if (args.length >= 3) {
            var category = args[1];
            if (isValidCategory(category)) {
                var name = args.shift();
                category = client.channels.cache.get(args.shift());
                appManager.buildApp(name, category, getQuestionsArray(args), true);
                message.channel.send(`Created ticket successfully.`);
            } else {
                // Invalid submission channel
                message.reply(`${category} is not a valid category ID!`);
            }
        } else {
            message.reply('there are not enough arguments! Make sure you are writing in the format name, category ID, questions');
        }

        function isValidCategory(categoryID) {
            var channel = message.guild.channels.cache.get(categoryID);
            return channel != undefined && channel instanceof discord.CategoryChannel;
        }

        function getQuestionsArray(fromArgs) {
            fromArgs = fromArgs.join(' ');
            var questions = fromArgs.split(/ *\n/g);
            questions.forEach((value, index, array) => {
                array[index] = value.trim();
                if (value.length == 0) {
                    array.splice(index, 1);
                }
            });
            return questions;
        }
    }
}