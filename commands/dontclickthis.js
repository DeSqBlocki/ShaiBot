module.exports = {
    slash: true,
    description: 'surprise!',
    category: 'meme',
    options: [
        {
            name: 'pwned',
            description: "Told you not to click on this",
            required: true,
            type: 3,
            choices: [
                { "name": 'never', "value": "never" },
                { "name": 'gonna', "value": "gonna" },
                { "name": 'give', "value": "give" },
                { "name": 'you', "value": "you" },
                { "name": 'up', "value": "up" },
                { "name": 'never', "value": "never" },
                { "name": 'gonna', "value": "gonna" },
                { "name": 'let', "value": "let" },
                { "name": 'you', "value": "you" },
                { "name": 'down', "value": "down" },
            ],
        },
    ],
    callback: async ({ interaction }) => {
        interaction.reply({
            content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            ephemeral: true,
        })
    }
}